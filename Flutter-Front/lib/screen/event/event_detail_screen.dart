import 'package:flutter/material.dart';

/// 행사 상세 안내 및 참가 신청 화면
class EventDetailScreen extends StatelessWidget {
  const EventDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final int? eventId = ModalRoute.of(context)?.settings.arguments as int?;

    return Scaffold(
      appBar: AppBar(
        title: const Text('행사 상세보기'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Text('행사 ID: ${eventId ?? "알 수 없음"}', style: const TextStyle(fontSize: 20)),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  // TODO: 행사 신청(Apply) Provider 연동
                },
                child: const Text('행사 참가 신청하기'),
              ),
            )
          ],
        ),
      ),
    );
  }
}
