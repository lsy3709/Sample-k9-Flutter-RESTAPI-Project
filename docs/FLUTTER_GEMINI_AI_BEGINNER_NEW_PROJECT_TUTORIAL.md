# Flutter Gemini AI 초보자 새 프로젝트 튜토리얼

> 목표: 기존 `Flutter-Front` 앱과 분리해서, 완전히 새 Flutter 프로젝트를 만들고 Gemini AI 화면과 기능을 하나씩 확인한다.  
> 권장 백엔드: `docs/SPRING_BOOT_GEMINI_NO_JWT_TEST_PROJECT_TUTORIAL.md`의 JWT 없는 Spring Boot 테스트 서버  
> 실습 기능: 홈 화면, 텍스트 챗봇, 이미지 분석, 이미지 Q&A

---

## 1. 전체 그림

이번 실습은 Flutter가 Gemini API를 직접 호출하지 않는다.  
Flutter는 Spring Boot 백엔드만 호출하고, 실제 Gemini API Key는 Spring Boot 서버에 둔다.

```text
Flutter 앱
  -> Spring Boot 테스트 서버
      -> Gemini API
```

이 방식이 초보자 실습에 좋은 이유:

- Flutter 앱에 Gemini API Key를 넣지 않아도 된다.
- 모바일 앱에서 secret key가 노출되는 위험을 줄일 수 있다.
- Flutter는 화면, HTTP 요청, 이미지 업로드에만 집중할 수 있다.

---

## 2. 먼저 준비할 것

### 2-1. Spring Boot 무인증 테스트 서버 실행

아래 문서를 먼저 따라 해서 Spring Boot 서버를 실행한다.

```text
docs/SPRING_BOOT_GEMINI_NO_JWT_TEST_PROJECT_TUTORIAL.md
```

이 문서 기준 서버 주소:

```text
http://localhost:18082
```

제공 API:

| 기능 | Method | URL |
|---|---|---|
| 텍스트 챗봇 | POST | `/api/ai/chat` |
| 이미지 분석 | POST | `/api/ai/analyze-image` |

이미지 Q&A까지 연습하려면 Spring Boot 쪽에 `/api/ai/multimodal` API도 추가되어 있어야 한다. 기존 `SpringBasic/api5012`에는 이 API가 이미 있다.

### 2-2. Flutter에서 사용할 서버 주소

실행 환경에 따라 백엔드 주소가 다르다.

| 실행 환경 | Flutter에서 써야 하는 주소 |
|---|---|
| Android Emulator | `http://10.0.2.2:18082` |
| iOS Simulator | `http://localhost:18082` |
| Chrome/Web | `http://localhost:18082` |
| 실제 Android/iPhone | `http://PC의_같은_WIFI_IP:18082` |

Android Emulator에서 `localhost`는 PC가 아니라 에뮬레이터 자신을 뜻한다.  
그래서 PC에서 실행 중인 Spring Boot에 접근하려면 `10.0.2.2`를 사용한다.

---

## 3. 새 Flutter 프로젝트 생성

작업 위치 예시:

```powershell
cd E:\0-sample-flutter-projectt-k9\Flutter-Front
flutter create gemini_ai_practice
cd gemini_ai_practice
```

실행 확인:

```powershell
flutter run
```

처음 기본 카운터 앱이 뜨면 준비 완료다.

---

## 4. 패키지 추가

파일: `pubspec.yaml`

`dependencies`에 아래 패키지를 추가한다.

```yaml
dependencies:
  flutter:
    sdk: flutter

  cupertino_icons: ^1.0.8
  http: ^1.2.2
  image_picker: ^1.1.2
```

패키지 설치:

```powershell
flutter pub get
```

각 패키지 역할:

| 패키지 | 역할 |
|---|---|
| `http` | Spring Boot API 호출 |
| `image_picker` | 갤러리/카메라 이미지 선택 |

---

## 5. Android 설정

로컬 Spring Boot 서버가 `http://` 주소라면 Android에서 cleartext HTTP를 허용해야 한다.

파일:

```text
android/app/src/main/AndroidManifest.xml
```

`<application>` 태그에 `android:usesCleartextTraffic="true"`를 추가한다.

```xml
<application
    android:label="gemini_ai_practice"
    android:name="${applicationName}"
    android:icon="@mipmap/ic_launcher"
    android:usesCleartextTraffic="true">
```

카메라까지 사용할 예정이면 권한도 추가한다.  
`<manifest>` 바로 아래, `<application>` 바깥에 둔다.

```xml
<uses-permission android:name="android.permission.CAMERA" />
```

갤러리만 먼저 쓸 거라면 카메라 권한은 나중에 추가해도 된다.

---

## 6. 추천 폴더 구조

`lib` 폴더를 아래처럼 구성한다.

```text
lib
  main.dart
  app.dart
  constants.dart
  services
    gemini_api_service.dart
  screens
    home_screen.dart
    chat_screen.dart
    image_analysis_screen.dart
    multimodal_screen.dart
```

처음에는 파일이 많아 보이지만 역할은 단순하다.

| 파일 | 역할 |
|---|---|
| `constants.dart` | 서버 주소 관리 |
| `gemini_api_service.dart` | HTTP 요청 담당 |
| `home_screen.dart` | 기능 선택 화면 |
| `chat_screen.dart` | 텍스트 챗봇 화면 |
| `image_analysis_screen.dart` | 이미지 분석 화면 |
| `multimodal_screen.dart` | 이미지 + 질문 화면 |

---

## 7. 서버 주소 설정

파일:

```text
lib/constants.dart
```

```dart
class AppConstants {
  // Android Emulator에서 PC localhost 접근
  static const String baseUrl = 'http://10.0.2.2:18082/api/ai';

  // iOS Simulator 또는 Chrome에서 테스트할 때는 아래로 바꾼다.
  // static const String baseUrl = 'http://localhost:18082/api/ai';

  // 실제 폰에서 테스트할 때는 PC의 같은 Wi-Fi IP를 사용한다.
  // static const String baseUrl = 'http://192.168.0.10:18082/api/ai';
}
```

---

## 8. API 서비스 만들기

파일:

```text
lib/services/gemini_api_service.dart
```

```dart
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';

import '../constants.dart';

class GeminiApiService {
  static Future<String> chat(String prompt) async {
    final response = await http.post(
      Uri.parse('${AppConstants.baseUrl}/chat'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'prompt': prompt}),
    );

    final bodyText = utf8.decode(response.bodyBytes);

    if (response.statusCode == 200) {
      final data = jsonDecode(bodyText) as Map<String, dynamic>;
      return data['reply'] as String? ?? '응답이 비어 있습니다.';
    }

    throw Exception(_extractErrorMessage(bodyText, response.statusCode));
  }

  static Future<String> analyzeImage(
    XFile image, {
    String prompt = '이 이미지를 한국어로 자세히 설명해주세요.',
  }) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('${AppConstants.baseUrl}/analyze-image'),
    );

    request.fields['prompt'] = prompt;
    request.files.add(
      await http.MultipartFile.fromPath('image', image.path),
    );

    final streamed = await request.send();
    final bodyText = await _readStreamedResponse(streamed);

    if (streamed.statusCode == 200) {
      final data = jsonDecode(bodyText) as Map<String, dynamic>;
      return data['description'] as String? ?? '이미지 설명이 비어 있습니다.';
    }

    throw Exception(_extractErrorMessage(bodyText, streamed.statusCode));
  }

  static Future<String> multimodal(XFile image, String question) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('${AppConstants.baseUrl}/multimodal'),
    );

    request.fields['question'] = question;
    request.files.add(
      await http.MultipartFile.fromPath('image', image.path),
    );

    final streamed = await request.send();
    final bodyText = await _readStreamedResponse(streamed);

    if (streamed.statusCode == 200) {
      final data = jsonDecode(bodyText) as Map<String, dynamic>;
      return data['answer'] as String? ?? '답변이 비어 있습니다.';
    }

    throw Exception(_extractErrorMessage(bodyText, streamed.statusCode));
  }

  static Future<String> _readStreamedResponse(
    http.StreamedResponse response,
  ) async {
    final bytes = await response.stream.toBytes();
    return utf8.decode(bytes);
  }

  static String _extractErrorMessage(String bodyText, int statusCode) {
    try {
      final data = jsonDecode(bodyText) as Map<String, dynamic>;
      final message = data['message'];
      if (message is String && message.isNotEmpty) {
        return message;
      }
    } catch (_) {
      // JSON 에러 응답이 아닐 수 있으므로 상태코드만 보여준다.
    }

    return '요청 실패: HTTP $statusCode';
  }
}
```

핵심:

- 텍스트 챗봇은 JSON으로 보낸다.
- 이미지 분석과 멀티모달은 `MultipartRequest`로 보낸다.
- Spring Controller의 파일 파라미터 이름이 `image`이므로 Flutter도 `image`로 보낸다.
- 무인증 테스트 서버를 쓰므로 `Authorization` 헤더가 없다.

---

## 9. main.dart

파일:

```text
lib/main.dart
```

```dart
import 'package:flutter/material.dart';

import 'app.dart';

void main() {
  runApp(const GeminiPracticeApp());
}
```

---

## 10. app.dart

파일:

```text
lib/app.dart
```

```dart
import 'package:flutter/material.dart';

import 'screens/chat_screen.dart';
import 'screens/home_screen.dart';
import 'screens/image_analysis_screen.dart';
import 'screens/multimodal_screen.dart';

class GeminiPracticeApp extends StatelessWidget {
  const GeminiPracticeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Gemini AI Practice',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      initialRoute: '/',
      routes: {
        '/': (_) => const HomeScreen(),
        '/chat': (_) => const ChatScreen(),
        '/image': (_) => const ImageAnalysisScreen(),
        '/multimodal': (_) => const MultimodalScreen(),
      },
    );
  }
}
```

---

## 11. 홈 화면 만들기

파일:

```text
lib/screens/home_screen.dart
```

```dart
import 'package:flutter/material.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Gemini AI 연습')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _MenuTile(
            icon: Icons.chat_bubble_outline,
            title: '텍스트 챗봇',
            subtitle: '문장을 보내고 Gemini 답변을 확인합니다.',
            routeName: '/chat',
          ),
          _MenuTile(
            icon: Icons.image_search_outlined,
            title: '이미지 분석',
            subtitle: '사진을 업로드하고 설명을 받아봅니다.',
            routeName: '/image',
          ),
          _MenuTile(
            icon: Icons.question_answer_outlined,
            title: '이미지 Q&A',
            subtitle: '사진과 질문을 함께 보내 답변을 받습니다.',
            routeName: '/multimodal',
          ),
        ],
      ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  const _MenuTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.routeName,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String routeName;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(icon, color: Colors.indigo),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => Navigator.pushNamed(context, routeName),
      ),
    );
  }
}
```

확인:

```powershell
flutter run
```

홈 화면에 메뉴 3개가 보이면 성공이다.

---

## 12. 텍스트 챗봇 화면 만들기

파일:

```text
lib/screens/chat_screen.dart
```

```dart
import 'package:flutter/material.dart';

import '../services/gemini_api_service.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _controller = TextEditingController();
  final List<_ChatMessage> _messages = [];
  bool _isLoading = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _isLoading) return;

    setState(() {
      _messages.add(_ChatMessage(role: 'user', text: text));
      _isLoading = true;
    });
    _controller.clear();

    try {
      final reply = await GeminiApiService.chat(text);
      setState(() {
        _messages.add(_ChatMessage(role: 'ai', text: reply));
      });
    } catch (e) {
      setState(() {
        _messages.add(_ChatMessage(role: 'ai', text: '오류: $e'));
      });
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('텍스트 챗봇')),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                final isUser = message.role == 'user';

                return Align(
                  alignment:
                      isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 300),
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isUser ? Colors.indigo.shade100 : Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: SelectableText(message.text),
                  ),
                );
              },
            ),
          ),
          if (_isLoading)
            const LinearProgressIndicator(minHeight: 2),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      decoration: const InputDecoration(
                        hintText: '질문을 입력하세요',
                        border: OutlineInputBorder(),
                      ),
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _isLoading ? null : _send,
                    icon: const Icon(Icons.send),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ChatMessage {
  const _ChatMessage({
    required this.role,
    required this.text,
  });

  final String role;
  final String text;
}
```

확인 질문:

```text
Flutter에서 StatefulWidget이 필요한 상황을 초보자에게 설명해줘.
```

정상이라면 Gemini 답변 말풍선이 추가된다.

---

## 13. 이미지 분석 화면 만들기

파일:

```text
lib/screens/image_analysis_screen.dart
```

```dart
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../services/gemini_api_service.dart';

class ImageAnalysisScreen extends StatefulWidget {
  const ImageAnalysisScreen({super.key});

  @override
  State<ImageAnalysisScreen> createState() => _ImageAnalysisScreenState();
}

class _ImageAnalysisScreenState extends State<ImageAnalysisScreen> {
  final ImagePicker _picker = ImagePicker();
  final TextEditingController _promptController = TextEditingController(
    text: '이 이미지를 한국어로 자세히 설명해주세요.',
  );

  XFile? _image;
  Uint8List? _imageBytes;
  String? _result;
  bool _isLoading = false;

  @override
  void dispose() {
    _promptController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picked = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );

    if (picked == null) return;

    final bytes = await picked.readAsBytes();
    setState(() {
      _image = picked;
      _imageBytes = bytes;
      _result = null;
    });
  }

  Future<void> _analyze() async {
    if (_image == null || _isLoading) return;

    setState(() => _isLoading = true);

    try {
      final result = await GeminiApiService.analyzeImage(
        _image!,
        prompt: _promptController.text.trim(),
      );

      setState(() => _result = result);
    } catch (e) {
      setState(() => _result = '오류: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('이미지 분석')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          AspectRatio(
            aspectRatio: 4 / 3,
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(12),
              ),
              child: _imageBytes == null
                  ? const Center(child: Text('이미지를 선택하세요'))
                  : ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.memory(_imageBytes!, fit: BoxFit.cover),
                    ),
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _pickImage,
            icon: const Icon(Icons.photo_library_outlined),
            label: const Text('갤러리에서 이미지 선택'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _promptController,
            minLines: 2,
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: '분석 프롬프트',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: _image == null || _isLoading ? null : _analyze,
            icon: const Icon(Icons.auto_fix_high),
            label: Text(_isLoading ? '분석 중...' : 'AI 이미지 분석'),
          ),
          const SizedBox(height: 20),
          if (_isLoading)
            const Center(child: CircularProgressIndicator())
          else if (_result != null)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: SelectableText(
                  _result!,
                  style: const TextStyle(height: 1.5),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
```

확인:

1. 갤러리에서 이미지 선택
2. 이미지 미리보기 확인
3. `AI 이미지 분석` 버튼 클릭
4. 설명 텍스트 확인

---

## 14. 이미지 Q&A 화면 만들기

이 화면은 Spring Boot 백엔드에 아래 API가 있을 때 동작한다.

```text
POST /api/ai/multimodal
```

파일:

```text
lib/screens/multimodal_screen.dart
```

```dart
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../services/gemini_api_service.dart';

class MultimodalScreen extends StatefulWidget {
  const MultimodalScreen({super.key});

  @override
  State<MultimodalScreen> createState() => _MultimodalScreenState();
}

class _MultimodalScreenState extends State<MultimodalScreen> {
  final ImagePicker _picker = ImagePicker();
  final TextEditingController _questionController = TextEditingController();

  XFile? _image;
  Uint8List? _imageBytes;
  String? _answer;
  bool _isLoading = false;

  @override
  void dispose() {
    _questionController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picked = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );

    if (picked == null) return;

    final bytes = await picked.readAsBytes();
    setState(() {
      _image = picked;
      _imageBytes = bytes;
      _answer = null;
    });
  }

  Future<void> _sendQuestion() async {
    final question = _questionController.text.trim();
    if (_image == null || question.isEmpty || _isLoading) return;

    setState(() => _isLoading = true);

    try {
      final answer = await GeminiApiService.multimodal(_image!, question);
      setState(() => _answer = answer);
    } catch (e) {
      setState(() => _answer = '오류: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final canSend = _image != null &&
        _questionController.text.trim().isNotEmpty &&
        !_isLoading;

    return Scaffold(
      appBar: AppBar(title: const Text('이미지 Q&A')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          AspectRatio(
            aspectRatio: 4 / 3,
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(12),
              ),
              child: _imageBytes == null
                  ? const Center(child: Text('질문할 이미지를 선택하세요'))
                  : ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.memory(_imageBytes!, fit: BoxFit.cover),
                    ),
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _pickImage,
            icon: const Icon(Icons.photo_library_outlined),
            label: const Text('갤러리에서 이미지 선택'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _questionController,
            minLines: 2,
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: '이미지에 대해 질문하기',
              hintText: '예) 이 사진에서 가장 중요한 물체는 무엇인가요?',
              border: OutlineInputBorder(),
            ),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: canSend ? _sendQuestion : null,
            icon: const Icon(Icons.send_outlined),
            label: Text(_isLoading ? '답변 생성 중...' : '질문 전송'),
          ),
          const SizedBox(height: 20),
          if (_isLoading)
            const Center(child: CircularProgressIndicator())
          else if (_answer != null)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: SelectableText(
                  _answer!,
                  style: const TextStyle(height: 1.5),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
```

확인 질문:

```text
이 이미지에서 보이는 내용을 3가지로 요약해줘.
```

---

## 15. 실행과 단계별 확인

### 15-1. Spring Boot 서버 확인

먼저 Postman 또는 Swagger에서 Spring API가 성공하는지 확인한다.

```text
POST http://localhost:18082/api/ai/chat
```

Postman에서 성공하지 않는다면 Flutter에서도 실패한다.

### 15-2. Flutter 실행

Android Emulator:

```powershell
flutter run
```

Chrome:

```powershell
flutter run -d chrome
```

Chrome으로 실행할 경우 `constants.dart`의 주소를 바꾼다.

```dart
static const String baseUrl = 'http://localhost:18082/api/ai';
```

### 15-3. 기능 확인 순서

1. 홈 화면 메뉴가 보이는지 확인
2. 텍스트 챗봇 질문 전송
3. 이미지 선택 후 미리보기 확인
4. 이미지 분석 요청
5. 이미지 Q&A 요청

---

## 16. 기존 Flutter-Front와 비교

기존 프로젝트:

```text
Flutter-Front/lib/service/ai_service.dart
```

기존 앱은 SpringBasic의 JWT 인증 프로젝트를 호출한다.

```dart
if (token != null) 'Authorization': 'Bearer $token'
```

새 연습 프로젝트는 인증 없는 Spring Boot 테스트 서버를 호출하므로 토큰 저장소가 필요 없다.

| 항목 | 기존 Flutter-Front | 새 연습 프로젝트 |
|---|---|---|
| 목적 | 전체 도서관 앱에 AI 기능 통합 | Gemini 기능만 단독 연습 |
| 인증 | JWT 사용 | 인증 없음 |
| 저장소 | `flutter_secure_storage` 사용 | 불필요 |
| 화면 | 기존 앱 탭/라우팅에 연결 | 홈 화면에서 직접 이동 |
| 난이도 | 중간 | 낮음 |

---

## 17. 자주 막히는 문제

### 17-1. `Connection refused`

원인:

- Spring Boot 서버가 꺼져 있다.
- 포트가 다르다.
- Android Emulator에서 `localhost`를 사용했다.

해결:

```dart
static const String baseUrl = 'http://10.0.2.2:18082/api/ai';
```

### 17-2. Android에서 HTTP 요청 실패

원인:

- `android:usesCleartextTraffic="true"`가 없다.

해결:

```xml
<application
    android:usesCleartextTraffic="true">
```

### 17-3. 이미지 선택이 안 됨

원인:

- `image_picker` 패키지 설치 누락
- 앱 권한 문제
- 에뮬레이터에 갤러리 이미지가 없음

해결:

```powershell
flutter pub get
flutter clean
flutter run
```

에뮬레이터 갤러리에 테스트 이미지를 먼저 넣어둔다.

### 17-4. 이미지 분석 API가 400

원인:

- multipart key 이름이 Spring과 다르다.

Spring Controller:

```java
@RequestPart MultipartFile image
```

Flutter:

```dart
request.files.add(
  await http.MultipartFile.fromPath('image', image.path),
);
```

둘 다 `image`로 맞아야 한다.

### 17-5. 이미지 Q&A만 실패

원인:

- JWT 없는 Spring Boot 테스트 프로젝트에 `/api/ai/multimodal` API가 아직 없다.

해결:

- 먼저 텍스트 챗봇과 이미지 분석만 완료한다.
- 이후 Spring Boot 쪽에 `multimodal` API를 추가하거나 기존 `SpringBasic/api5012`를 사용한다.

---

## 18. 연습 과제

### 과제 1. 채팅 화면 개선

질문이 비어 있을 때 SnackBar를 띄운다.

```dart
ScaffoldMessenger.of(context).showSnackBar(
  const SnackBar(content: Text('질문을 입력해주세요.')),
);
```

### 과제 2. 이미지 prompt 바꿔보기

이미지 분석 화면에서 기본 prompt를 바꿔본다.

```text
이 이미지에서 보이는 물체를 목록으로 정리해줘.
```

```text
이 이미지를 블로그 글 제목처럼 표현해줘.
```

### 과제 3. 카메라 버튼 추가

`ImageSource.gallery` 대신 `ImageSource.camera`를 쓰는 버튼을 추가한다.

```dart
final picked = await _picker.pickImage(
  source: ImageSource.camera,
  imageQuality: 85,
);
```

### 과제 4. 에러 메시지 보기 좋게 만들기

현재는 `오류: Exception: ...` 형태로 보일 수 있다.  
사용자에게 보여줄 때는 `Exception:` 글자를 제거해본다.

```dart
final message = e.toString().replaceFirst('Exception: ', '');
```

---

## 19. 학습 순서 추천

1. Spring Boot 무인증 테스트 서버 실행
2. Postman으로 `/api/ai/chat` 성공 확인
3. 새 Flutter 프로젝트 생성
4. 홈 화면 만들기
5. 채팅 화면 만들기
6. 이미지 분석 화면 만들기
7. multipart 요청 흐름 이해하기
8. 이미지 Q&A 추가하기
9. 기존 `Flutter-Front` 앱의 `AiService`와 비교하기

---

## 20. 핵심 정리

- Flutter에는 Gemini API Key를 넣지 않는다.
- Flutter는 Spring Boot 백엔드만 호출한다.
- JSON 요청은 `http.post`를 사용한다.
- 이미지 업로드는 `http.MultipartRequest`를 사용한다.
- Android Emulator에서 PC 서버 주소는 `10.0.2.2`다.
- 새 프로젝트에서는 JWT 없이 기능을 먼저 익힌다.
- 이후 기존 `Flutter-Front`에 붙일 때 JWT, 라우팅, 화면 스타일을 통합하면 된다.

