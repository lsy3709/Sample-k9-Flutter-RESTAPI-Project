import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../../service/ai_service.dart';

class GeminiMultimodalScreen extends StatefulWidget {
  const GeminiMultimodalScreen({super.key});

  @override
  State<GeminiMultimodalScreen> createState() => _GeminiMultimodalScreenState();
}

class _GeminiMultimodalScreenState extends State<GeminiMultimodalScreen> {
  final ImagePicker _picker = ImagePicker();
  final TextEditingController _questionCtrl = TextEditingController();
  XFile? _image;
  Uint8List? _imageBytes;
  String? _answer;
  bool _isLoading = false;

  @override
  void dispose() {
    _questionCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    final picked = await _picker.pickImage(source: source, imageQuality: 85);
    if (picked != null) {
      final bytes = await picked.readAsBytes();
      setState(() {
        _image = picked;
        _imageBytes = bytes;
        _answer = null;
      });
    }
  }

  Future<void> _send() async {
    final question = _questionCtrl.text.trim();
    if (_image == null || question.isEmpty) return;
    setState(() => _isLoading = true);
    try {
      final result = await AiService.multimodal(_image!, question);
      setState(() => _answer = result);
    } catch (e) {
      setState(() => _answer = '오류: ${e.toString()}');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final canSend =
        _image != null && _questionCtrl.text.trim().isNotEmpty && !_isLoading;

    return Scaffold(
      appBar: AppBar(title: const Text('Gemini 이미지 Q&A')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 이미지 미리보기
            Container(
              height: 220,
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
                          Icon(Icons.add_photo_alternate_outlined,
                              size: 56, color: Colors.grey),
                          SizedBox(height: 8),
                          Text('질문할 이미지를 선택하세요',
                              style: TextStyle(color: Colors.grey)),
                        ],
                      ),
                    )
                  : ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.memory(
                        _imageBytes!,
                        fit: BoxFit.cover,
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
            const SizedBox(height: 16),

            // 질문 입력
            TextField(
              controller: _questionCtrl,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: '이미지에 대해 질문을 입력하세요.\n예) 이 도서의 주제는 무엇인가요?',
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10)),
                contentPadding: const EdgeInsets.all(14),
              ),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 12),

            // 전송 버튼
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6A1B9A),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
              icon: _isLoading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.send_outlined),
              label: Text(
                _isLoading ? 'AI 응답 생성 중...' : '질문 전송',
                style: const TextStyle(fontSize: 16),
              ),
              onPressed: canSend ? _send : null,
            ),
            const SizedBox(height: 24),

            // AI 답변
            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else if (_answer != null) ...[
              Row(
                children: const [
                  Icon(Icons.auto_awesome, color: Color(0xFF6A1B9A), size: 20),
                  SizedBox(width: 8),
                  Text('AI 답변',
                      style: TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 16)),
                ],
              ),
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.purple[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.purple[200]!),
                ),
                child: SelectableText(
                  _answer!,
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
