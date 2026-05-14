import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../../service/ai_service.dart';

class GeminiImageScreen extends StatefulWidget {
  const GeminiImageScreen({super.key});

  @override
  State<GeminiImageScreen> createState() => _GeminiImageScreenState();
}

class _GeminiImageScreenState extends State<GeminiImageScreen> {
  final ImagePicker _picker = ImagePicker();
  XFile? _image;
  Uint8List? _imageBytes;
  String? _description;
  bool _isLoading = false;

  Future<void> _pickImage(ImageSource source) async {
    final picked = await _picker.pickImage(source: source, imageQuality: 85);
    if (picked != null) {
      final bytes = await picked.readAsBytes();
      setState(() {
        _image = picked;
        _imageBytes = bytes;
        _description = null;
      });
    }
  }

  Future<void> _analyze() async {
    if (_image == null) return;
    setState(() => _isLoading = true);
    try {
      final result = await AiService.analyzeImage(_image!);
      setState(() => _description = result);
    } catch (e) {
      setState(() => _description = '오류: ${e.toString()}');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Gemini 이미지 분석')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 이미지 미리보기 영역
            Container(
              height: 240,
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
                          Icon(Icons.image_outlined, size: 64, color: Colors.grey),
                          SizedBox(height: 8),
                          Text('이미지를 선택하세요', style: TextStyle(color: Colors.grey)),
                        ],
                      ),
                    )
                  : ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.memory(
                        _imageBytes!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const Center(
                          child: Icon(Icons.broken_image, size: 64, color: Colors.grey),
                        ),
                      ),
                    ),
            ),
            const SizedBox(height: 16),

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

            // 분석 버튼
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1565C0),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              icon: const Icon(Icons.auto_fix_high),
              label: const Text('AI 이미지 분석', style: TextStyle(fontSize: 16)),
              onPressed: (_image != null && !_isLoading) ? _analyze : null,
            ),
            const SizedBox(height: 24),

            // 분석 결과
            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else if (_description != null) ...[
              Row(
                children: const [
                  Icon(Icons.auto_awesome, color: Color(0xFF1565C0), size: 20),
                  SizedBox(width: 8),
                  Text('분석 결과', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.blue[200]!),
                ),
                child: SelectableText(
                  _description!,
                  style: const TextStyle(fontSize: 15, height: 1.6),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
