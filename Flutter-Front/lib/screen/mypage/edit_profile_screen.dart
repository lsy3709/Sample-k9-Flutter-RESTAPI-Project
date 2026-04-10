import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:provider/provider.dart';

import '../../const/api_constants.dart';
import '../../controller/auth/login_controller.dart';

/// 내 정보 수정 화면
/// - 프로필 이미지 변경 (카메라 / 갤러리, 5MB 제한)
/// - 이름, 이메일, 거주 지역 수정
/// - PUT /api/member/profile-image (base64 업로드)
/// - PUT /api/member/update (이름/이메일/지역)
class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _mnameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  String? _selectedRegion;
  bool _isLoading = false;

  // 새로 선택한 프로필 이미지 (null이면 서버 이미지 유지)
  File? _newImageFile;
  // 내부 앱 저장 경로 (선택 후 저장된 경로 표시용)
  String? _savedLocalPath;

  final List<String> _regions = [
    '서울특별시', '부산광역시', '대구광역시', '인천광역시',
    '광주광역시', '대전광역시', '울산광역시', '세종특별자치시',
    '경기도', '강원특별자치도', '충청북도', '충청남도',
    '전북특별자치도', '전라남도', '경상북도', '경상남도', '제주특별자치도'
  ];

  @override
  void initState() {
    super.initState();
    final ctrl = context.read<LoginController>();
    _mnameCtrl.text = ctrl.memberName ?? '';
    _emailCtrl.text = ctrl.memberEmail ?? '';
    final region = ctrl.memberRegion;
    if (region != null && _regions.contains(region)) {
      _selectedRegion = region;
    }
  }

  @override
  void dispose() {
    _mnameCtrl.dispose();
    _emailCtrl.dispose();
    super.dispose();
  }

  // ── 프로필 이미지 선택 ────────────────────────────────────────────

  Future<void> _pickImage(ImageSource source) async {
    final picker = ImagePicker();
    final XFile? picked = await picker.pickImage(
      source: source,
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 85,
    );
    if (picked == null) return;

    final file = File(picked.path);
    final size = await file.length();

    if (size > 5 * 1024 * 1024) {
      if (!mounted) return;
      _showSnack('이미지 크기가 5MB를 초과합니다 (${(size / 1024 / 1024).toStringAsFixed(1)}MB)');
      return;
    }

    // 앱 내부 저장소에 복사
    final localPath = await _saveToAppStorage(file);

    setState(() {
      _newImageFile = file;
      _savedLocalPath = localPath;
    });
  }

  Future<String?> _saveToAppStorage(File src) async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      final profileDir = Directory('${dir.path}/profile_images');
      await profileDir.create(recursive: true);
      final dest = '${profileDir.path}/${p.basename(src.path)}';
      await src.copy(dest);
      return dest;
    } catch (_) {
      return null;
    }
  }

  void _showImageSourceSheet() {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('갤러리에서 선택'),
              onTap: () {
                Navigator.pop(ctx);
                _pickImage(ImageSource.gallery);
              },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('카메라로 촬영'),
              onTap: () {
                Navigator.pop(ctx);
                _pickImage(ImageSource.camera);
              },
            ),
            if (_newImageFile != null)
              ListTile(
                leading: const Icon(Icons.delete, color: Colors.red),
                title: const Text('선택 취소', style: TextStyle(color: Colors.red)),
                onTap: () {
                  Navigator.pop(ctx);
                  setState(() {
                    _newImageFile = null;
                    _savedLocalPath = null;
                  });
                },
              ),
          ],
        ),
      ),
    );
  }

  // ── 저장 처리 ─────────────────────────────────────────────────────

  Future<void> _submit() async {
    final mname = _mnameCtrl.text.trim();
    final email = _emailCtrl.text.trim();

    if (mname.isEmpty || email.isEmpty) {
      _showSnack('이름과 이메일을 입력하세요.');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final storage = const FlutterSecureStorage();
      final token = await storage.read(key: 'accessToken');
      final mid = await storage.read(key: 'mid');

      if (token == null || mid == null) {
        _showSnack('로그인 정보가 없습니다. 다시 로그인하세요.');
        return;
      }

      // 1단계: 새 프로필 이미지가 있으면 업로드
      if (_newImageFile != null) {
        await _uploadProfileImage(mid, token);
      }

      // 2단계: 이름/이메일/지역 수정
      final res = await http.put(
        Uri.parse('${ApiConstants.springBaseUrl}/member/update'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'mid': mid,
          'mname': mname,
          'email': email,
          'region': _selectedRegion,
        }),
      );

      if (!mounted) return;

      if (res.statusCode == 200) {
        await context.read<LoginController>().loadMemberInfo();
        _showSnack('정보가 수정되었습니다.');
        Future.delayed(const Duration(milliseconds: 800), () {
          if (mounted) Navigator.pop(context);
        });
      } else {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        _showSnack('수정 실패: ${data['message'] ?? '오류가 발생했습니다.'}');
      }
    } catch (e) {
      if (!mounted) return;
      _showSnack('오류: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _uploadProfileImage(String mid, String token) async {
    try {
      final bytes = await _newImageFile!.readAsBytes();
      final ext = p.extension(_newImageFile!.path)
          .toLowerCase()
          .replaceAll('.', '');
      final mime = ext == 'png' ? 'png' : 'jpeg';
      final base64Str =
          'data:image/$mime;base64,${base64Encode(bytes)}';

      await http.put(
        Uri.parse('${ApiConstants.springBaseUrl}/member/profile-image'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'mid': mid, 'base64Image': base64Str}),
      );
    } catch (_) {
      // 이미지 업로드 실패해도 기본 정보 수정은 계속 진행
    }
  }

  void _showSnack(String msg) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(msg)));
  }

  // ── UI ───────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final ctrl = context.watch<LoginController>();
    final serverProfileImg = ctrl.memberProfileImage;
    final serverBase =
        ApiConstants.springBaseUrl.replaceAll('/api', '');

    return Scaffold(
      appBar: AppBar(title: const Text('내 정보 수정'), centerTitle: true),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // ── 프로필 이미지 ──
            Center(
              child: Stack(
                alignment: Alignment.bottomRight,
                children: [
                  GestureDetector(
                    onTap: _showImageSourceSheet,
                    child: _buildAvatar(
                        serverProfileImg, serverBase, ctrl),
                  ),
                  GestureDetector(
                    onTap: _showImageSourceSheet,
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.indigo,
                        shape: BoxShape.circle,
                        border:
                            Border.all(color: Colors.white, width: 2),
                      ),
                      child: const Icon(Icons.camera_alt,
                          size: 18, color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 6),
            Text(
              _newImageFile != null
                  ? '새 이미지 선택됨 (저장 버튼 눌러서 적용)'
                  : '이미지를 눌러 변경 (5MB 이하)',
              style: TextStyle(
                  fontSize: 12,
                  color: _newImageFile != null
                      ? Colors.indigo
                      : Colors.grey),
            ),

            // 내부 저장 경로 표시 (디버그용)
            if (_savedLocalPath != null) ...[
              const SizedBox(height: 4),
              Text(
                '앱 내부 저장: $_savedLocalPath',
                style:
                    const TextStyle(fontSize: 10, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
            ],

            const SizedBox(height: 24),

            // ── 이름 ──
            TextField(
              controller: _mnameCtrl,
              decoration: const InputDecoration(
                labelText: '이름 *',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.person_outline),
              ),
            ),
            const SizedBox(height: 16),

            // ── 이메일 ──
            TextField(
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: '이메일 *',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.email_outlined),
              ),
            ),
            const SizedBox(height: 16),

            // ── 지역 선택 ──
            DropdownButtonFormField<String>(
              value: _selectedRegion,
              decoration: const InputDecoration(
                labelText: '지역 선택',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.map_outlined),
              ),
              hint: const Text('거주 지역을 선택하세요'),
              items: _regions
                  .map((r) =>
                      DropdownMenuItem(value: r, child: Text(r)))
                  .toList(),
              onChanged: (v) => setState(() => _selectedRegion = v),
            ),
            const SizedBox(height: 32),

            // ── 저장 버튼 ──
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                child: _isLoading
                    ? const SizedBox(
                        height: 22,
                        width: 22,
                        child:
                            CircularProgressIndicator(strokeWidth: 2))
                    : const Text('저장하기',
                        style: TextStyle(fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAvatar(
      String? serverProfileImg, String serverBase, LoginController ctrl) {
    // 1순위: 새로 선택한 로컬 파일
    if (_newImageFile != null) {
      return CircleAvatar(
        radius: 55,
        backgroundImage: FileImage(_newImageFile!),
      );
    }

    // 2순위: 서버에 저장된 이미지
    if (serverProfileImg != null && serverProfileImg.isNotEmpty) {
      return CircleAvatar(
        radius: 55,
        backgroundColor: Colors.grey[200],
        child: ClipOval(
          child: Image.network(
            '$serverBase/upload/$serverProfileImg',
            width: 110,
            height: 110,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _defaultAvatar(ctrl),
          ),
        ),
      );
    }

    // 3순위: 이니셜
    return CircleAvatar(
      radius: 55,
      backgroundColor: Colors.grey[200],
      child: _defaultAvatar(ctrl),
    );
  }

  Widget _defaultAvatar(LoginController ctrl) {
    final name = ctrl.memberName ?? ctrl.currentMid ?? '?';
    return Text(
      name[0].toUpperCase(),
      style: TextStyle(
          fontSize: 40,
          fontWeight: FontWeight.bold,
          color: Theme.of(context).primaryColor),
    );
  }
}
