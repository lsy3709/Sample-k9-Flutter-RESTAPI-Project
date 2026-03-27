import 'package:flutter/material.dart';

/// 특정 공지사항의 본문 내용과 상세 정보를 확인하는 화면
class NoticeDetailScreen extends StatelessWidget {
  const NoticeDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final int? noticeId = ModalRoute.of(context)?.settings.arguments as int?;

    return Scaffold(
      appBar: AppBar(
        title: const Text('공지사항 상세보기'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Text('공지 ID: ${noticeId ?? "알 수 없음"}\n\n게시글 본문이 출력되는 영역입니다.',
            style: const TextStyle(fontSize: 16)),
      ),
    );
  }
}
