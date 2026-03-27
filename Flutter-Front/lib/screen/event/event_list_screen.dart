import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../controller/event_controller.dart';

/// 이달의 도서관 행사 목록 화면
class EventListScreen extends StatefulWidget {
  const EventListScreen({super.key});

  @override
  State<EventListScreen> createState() => _EventListScreenState();
}

class _EventListScreenState extends State<EventListScreen> {
  @override
  void initState() {
    super.initState();
    // 데이터 페칭 시작
    Future.microtask(() {
      Provider.of<EventController>(context, listen: false).fetchEvents();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('도서관 주요 행사'),
      ),
      body: Consumer<EventController>(
        builder: (context, controller, child) {
          if (controller.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (controller.eventList.isEmpty) {
            return const Center(child: Text('현재 등록된 행사가 없습니다.'));
          }
          
          return ListView.builder(
            itemCount: controller.eventList.length,
            itemBuilder: (context, index) {
              final event = controller.eventList[index];
              return Card(
                child: ListTile(
                  title: Text(event.title ?? '행사명 없음'),
                  subtitle: Text(event.eventDate ?? '날짜 미정'),
                  onTap: () {
                    // 특정 행사 상세 화면으로 푸시 로직 적용
                    Navigator.pushNamed(context, '/eventDetail', arguments: event.id);
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}
