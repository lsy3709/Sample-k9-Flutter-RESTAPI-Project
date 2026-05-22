import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../../service/ai_service.dart';

class GeminiBusinessCardScreen extends StatefulWidget {
  const GeminiBusinessCardScreen({super.key});

  @override
  State<GeminiBusinessCardScreen> createState() =>
      _GeminiBusinessCardScreenState();
}

class _GeminiBusinessCardScreenState extends State<GeminiBusinessCardScreen> {
  final ImagePicker _picker = ImagePicker();
  XFile? _image;
  Uint8List? _imageBytes;
  Map<String, dynamic>? _ocrResult;
  Map<String, dynamic>? _searchResult;
  bool _isLoadingOcr = false;
  bool _isLoadingSearch = false;

  Future<void> _pickImage(ImageSource source) async {
    final picked = await _picker.pickImage(source: source, imageQuality: 90);
    if (picked != null) {
      final bytes = await picked.readAsBytes();
      setState(() {
        _image = picked;
        _imageBytes = bytes;
        _ocrResult = null;
        _searchResult = null;
      });
    }
  }

  Future<void> _runOcr() async {
    if (_image == null) return;
    setState(() {
      _isLoadingOcr = true;
      _searchResult = null;
    });
    try {
      final result = await AiService.ocrBusinessCard(_image!);
      setState(() => _ocrResult = result);
    } catch (e) {
      _showError('명함 인식 오류: ${e.toString()}');
    } finally {
      setState(() => _isLoadingOcr = false);
    }
  }

  Future<void> _runSearch() async {
    if (_image == null) return;
    setState(() => _isLoadingSearch = true);
    try {
      final result = await AiService.searchByBusinessCard(_image!);
      print('검색 결과 데이터: $result'); // 콘솔에 출력
      setState(() => _searchResult = result);
    } catch (e) {
      _showError('회원 검색 오류: ${e.toString()}');
    } finally {
      setState(() => _isLoadingSearch = false);
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  Widget _infoRow(String label, String? value) {
    if (value == null || value.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 68,
            child: Text(label,
                style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500)),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontSize: 14)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('명함 OCR · 회원 검색')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 이미지 미리보기
            Container(
              height: 200,
              decoration: BoxDecoration(
                color: Colors.grey[100],
                border: Border.all(color: Colors.grey[300]!),
                borderRadius: BorderRadius.circular(12),
              ),
              child: _image == null
                  ? const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.contact_page_outlined,
                              size: 56, color: Colors.grey),
                          SizedBox(height: 8),
                          Text('명함 이미지를 선택하세요',
                              style: TextStyle(color: Colors.grey)),
                        ],
                      ),
                    )
                  : ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.memory(
                        _imageBytes!,
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => const Center(
                          child: Icon(Icons.broken_image,
                              size: 56, color: Colors.grey),
                        ),
                      ),
                    ),
            ),
            const SizedBox(height: 12),

            // 이미지 선택 버튼
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.photo_library_outlined),
                    label: const Text('갤러리'),
                    onPressed: () => _pickImage(ImageSource.gallery),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.camera_alt_outlined),
                    label: const Text('카메라'),
                    onPressed: () => _pickImage(ImageSource.camera),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // 명함 인식 버튼
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF5E35B1),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
              icon: _isLoadingOcr
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.document_scanner_outlined),
              label: Text(
                  _isLoadingOcr ? '인식 중...' : '명함 인식 (OCR)',
                  style: const TextStyle(fontSize: 16)),
              onPressed: (_image != null && !_isLoadingOcr && !_isLoadingSearch)
                  ? _runOcr
                  : null,
            ),
            const SizedBox(height: 24),

            // OCR 결과 카드
            if (_ocrResult != null) ...[
              Row(
                children: const [
                  Icon(Icons.badge_outlined, color: Color(0xFF5E35B1), size: 20),
                  SizedBox(width: 8),
                  Text('인식된 명함 정보',
                      style:
                          TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ],
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.purple[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.purple[200]!),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _infoRow('이름', _ocrResult!['name']?.toString()),
                    _infoRow('회사', _ocrResult!['company']?.toString()),
                    _infoRow('부서', _ocrResult!['department']?.toString()),
                    _infoRow('직책', _ocrResult!['position']?.toString()),
                    _infoRow('이메일', _ocrResult!['email']?.toString()),
                    _infoRow('전화', _ocrResult!['phone']?.toString()),
                    _infoRow('주소', _ocrResult!['address']?.toString()),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // 회원 검색 버튼
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2E7D32),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
                icon: _isLoadingSearch
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.person_search_outlined),
                label: Text(
                    _isLoadingSearch ? '검색 중...' : 'DB 회원 검색',
                    style: const TextStyle(fontSize: 16)),
                onPressed: !_isLoadingSearch ? _runSearch : null,
              ),
              const SizedBox(height: 24),
            ],

            // 회원 검색 결과
            if (_searchResult != null) ...[
              Row(
                children: const [
                  Icon(Icons.manage_accounts, color: Color(0xFF2E7D32), size: 20),
                  SizedBox(width: 8),
                  Text('회원 검색 결과',
                      style:
                          TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ],
              ),
              const SizedBox(height: 10),
              _searchResult!['matched'] == true
                  ? _MatchedMemberCard(
                      member: _searchResult!['extractedCard'] as Map<String, dynamic>?,
                      matchType: _searchResult!['matchType']?.toString(),
                    )
                  : Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.orange[50],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.orange[200]!),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.info_outline, color: Colors.orange),
                          SizedBox(width: 10),
                          Text('일치하는 회원을 찾지 못했습니다.',
                              style: TextStyle(fontSize: 14)),
                        ],
                      ),
                    ),
            ],
          ],
        ),
      ),
    );
  }
}

class _MatchedMemberCard extends StatelessWidget {
  final Map<String, dynamic>? member;
  final String? matchType;

  const _MatchedMemberCard({this.member, this.matchType});

  @override
  Widget build(BuildContext context) {
    final m = member ?? {};
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green[300]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.green, size: 20),
              const SizedBox(width: 8),
              Text('매칭 성공  ·  ${matchType ?? ''}',
                  style: const TextStyle(
                      color: Colors.green,
                      fontWeight: FontWeight.bold,
                      fontSize: 13)),
            ],
          ),
          const Divider(height: 20),
          _row('아이디', m['mid']?.toString()),
          _row('이름', m['mname']?.toString()),
          _row('이메일', m['email']?.toString()),
          _row('지역', m['region']?.toString()),
          _row('역할', m['role']?.toString()),
        ],
      ),
    );
  }

  Widget _row(String label, String? value) {
    if (value == null || value.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          SizedBox(
            width: 60,
            child: Text(label,
                style: TextStyle(fontSize: 13, color: Colors.grey[600])),
          ),
          Expanded(
              child: Text(value,
                  style: const TextStyle(
                      fontSize: 14, fontWeight: FontWeight.w500))),
        ],
      ),
    );
  }
}
