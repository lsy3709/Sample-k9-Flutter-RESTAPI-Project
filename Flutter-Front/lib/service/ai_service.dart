import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:image_picker/image_picker.dart';
import '../../const/api_constants.dart';

class AiService {
  static const String _baseUrl = '${ApiConstants.springBaseUrl2}/api/ai';
  static const _storage = FlutterSecureStorage();

  static Future<Map<String, String>> _getHeaders() async {
    final token = await _storage.read(key: 'accessToken');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<String?> _getToken() async =>
      _storage.read(key: 'accessToken');

  // ── 멀티파트 요청에 인증 토큰 추가 ─────────────────────────────
  static Future<void> _addAuth(http.MultipartRequest req) async {
    final token = await _getToken();
    if (token != null) req.headers['Authorization'] = 'Bearer $token';
  }

  // ── 스트림 응답 → UTF-8 문자열 변환 ────────────────────────────
  static Future<String> _readStream(http.StreamedResponse res) async {
    final bytes = await res.stream.toBytes();
    return utf8.decode(bytes);
  }

  // ── F-01: 텍스트 챗봇 ──────────────────────────────────────────
  static Future<String> chat(String message, List<Map<String, dynamic>> history) async {
    final headers = await _getHeaders();
    final body = jsonEncode({'prompt': message});

    try {
      final res = await http.post(
        Uri.parse('$_baseUrl/chat'),
        headers: headers,
        body: body,
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        return data['reply'] ?? '응답을 받지 못했습니다.';
      } else {
        throw Exception('채팅 응답 에러 (상태코드: ${res.statusCode})');
      }
    } catch (e) {
      throw Exception('서버 연결 오류: $e');
    }
  }

  // ── F-02: 이미지 분석 ──────────────────────────────────────────
  static Future<String> analyzeImage(
    XFile image, {
    String prompt = '이 이미지를 한국어로 자세히 설명해주세요.',
  }) async {
    final req = http.MultipartRequest(
      'POST',
      Uri.parse('$_baseUrl/analyze-image'),
    );
    await _addAuth(req);
    req.files.add(await http.MultipartFile.fromPath('image', image.path));
    req.fields['prompt'] = prompt;

    final streamed = await req.send();
    final body = await _readStream(streamed);
    if (streamed.statusCode == 200) {
      final data = jsonDecode(body);
      return data['description'] ?? '설명을 받지 못했습니다.';
    } else {
      throw Exception('이미지 분석 실패 (상태코드: ${streamed.statusCode})');
    }
  }

  // ── F-03: 명함 OCR ─────────────────────────────────────────────
  static Future<Map<String, dynamic>> ocrBusinessCard(XFile image) async {
    final req = http.MultipartRequest(
      'POST',
      Uri.parse('$_baseUrl/ocr/business-card'),
    );
    await _addAuth(req);
    req.files.add(await http.MultipartFile.fromPath('image', image.path));

    final streamed = await req.send();
    final body = await _readStream(streamed);
    if (streamed.statusCode == 200) {
      return jsonDecode(body) as Map<String, dynamic>;
    } else {
      throw Exception('명함 인식 실패 (상태코드: ${streamed.statusCode})');
    }
  }

  // ── F-04: 명함 → 회원 검색 ─────────────────────────────────────
  static Future<Map<String, dynamic>> searchByBusinessCard(XFile image) async {
    final req = http.MultipartRequest(
      'POST',
      Uri.parse('$_baseUrl/ocr/search'),
    );
    await _addAuth(req);
    req.files.add(await http.MultipartFile.fromPath('image', image.path));

    final streamed = await req.send();
    final body = await _readStream(streamed);
    if (streamed.statusCode == 200) {
      return jsonDecode(body) as Map<String, dynamic>;
    } else {
      throw Exception('회원 검색 실패 (상태코드: ${streamed.statusCode})');
    }
  }

  // ── F-05: 멀티모달 Q&A (이미지 + 질문) ────────────────────────
  static Future<String> multimodal(XFile image, String question) async {
    final req = http.MultipartRequest(
      'POST',
      Uri.parse('$_baseUrl/multimodal'),
    );
    await _addAuth(req);
    req.files.add(await http.MultipartFile.fromPath('image', image.path));
    req.fields['question'] = question;

    final streamed = await req.send();
    final body = await _readStream(streamed);
    if (streamed.statusCode == 200) {
      final data = jsonDecode(body);
      return data['answer'] ?? '답변을 받지 못했습니다.';
    } else {
      throw Exception('멀티모달 요청 실패 (상태코드: ${streamed.statusCode})');
    }
  }
}
