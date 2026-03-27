import 'package:flutter/material.dart';

/// 1:1 새로운 문의를 작성하여 서버(관리자)에 제출하는 폼 화면
class InquiryWriteScreen extends StatelessWidget {
  const InquiryWriteScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('문의 작성하기'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            const TextField(
              decoration: InputDecoration(
                labelText: '제목',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            const Expanded(
              child: TextField(
                maxLines: null,
                expands: true,
                decoration: InputDecoration(
                  labelText: '내용',
                  border: OutlineInputBorder(),
                ),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () {
                  // TODO: Controller의 postInquiry 연동
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('문의가 등록되었습니다.')),
                  );
                  Navigator.pop(context);
                },
                child: const Text('작성 완료'),
              ),
            )
          ],
        ),
      ),
    );
  }
}
