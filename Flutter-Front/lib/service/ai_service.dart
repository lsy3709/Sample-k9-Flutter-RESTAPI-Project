import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
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

  static Future<String> chat(String message, List<Map<String, dynamic>> history) async {
    final headers = await _getHeaders();
    final body = jsonEncode({
      'prompt': message,
      // history is ignored in simple DTO but kept for compatibility
    });

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
}
