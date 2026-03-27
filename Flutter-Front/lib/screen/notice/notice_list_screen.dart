import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../controller/notice_controller.dart';

/// 관리자가 작성한 공지사항 목록을 확인하는 화면
class NoticeListScreen extends StatefulWidget {
  const NoticeListScreen({super.key});

  @override
  State<NoticeListScreen> createState() => _NoticeListScreenState();
}

class _NoticeListScreenState extends State<NoticeListScreen> {
  @override
  void initState() {
    super.initState();
    // 데이터 페칭
    Future.microtask(() {
      Provider.of<NoticeController>(context, listen: false).fetchNotices();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('공지사항'),
      ),
      body: Consumer<NoticeController>(
        builder: (context, controller, child) {
          if (controller.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (controller.noticeList.isEmpty) {
            return const Center(child: Text('등록된 공지사항이 없습니다.'));
          }

          return ListView.builder(
            itemCount: controller.noticeList.length,
            itemBuilder: (context, index) {
              final notice = controller.noticeList[index];
              return ListTile(
                leading: const Icon(Icons.campaign),
                title: Text(notice.title ?? '공지'),
                subtitle: Text(notice.regDate ?? ''),
                trailing: Text('조회 ${notice.viewCount ?? 0}'),
                onTap: () {
                  Navigator.pushNamed(context, '/noticeDetail', arguments: notice.id);
                },
              );
            },
          );
        },
      ),
    );
  }
}
