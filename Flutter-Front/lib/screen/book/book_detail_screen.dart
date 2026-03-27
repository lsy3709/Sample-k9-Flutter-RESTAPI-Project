import 'package:flutter/material.dart';

/// 도서 상세 정보 및 QR코드 조회 화면
class BookDetailScreen extends StatelessWidget {
  const BookDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Route로 넘어온 도서 id 확인
    final int? bookId = ModalRoute.of(context)?.settings.arguments as int?;

    return Scaffold(
      appBar: AppBar(
        title: const Text('도서 상세 정보'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('전달받은 도서 ID: ${bookId ?? "없음"}', style: const TextStyle(fontSize: 18)),
            const SizedBox(height: 20),
            // 도서 상세 이미지 또는 타이틀 플레이스홀더
            Container(
              height: 200,
              width: double.infinity,
              color: Colors.grey[300],
              child: const Center(child: Text('도서 표지 이미지 영역')),
            ),
            const SizedBox(height: 20),
            const Text('도서명: 샘플 도서'),
            const Text('저자: 샘플 저자'),
            const Spacer(),
            // 예약 / 대여 버튼
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('대여 및 예약 기능 준비중입니다.')),
                  );
                },
                child: const Text('대여/예약 하기'),
              ),
            )
          ],
        ),
      ),
    );
  }
}
