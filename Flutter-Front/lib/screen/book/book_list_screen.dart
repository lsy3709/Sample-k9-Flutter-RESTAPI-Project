import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../controller/book_controller.dart';

/// 도서 검색 및 전체 도서 목록을 보여주는 화면
class BookListScreen extends StatefulWidget {
  const BookListScreen({super.key});

  @override
  State<BookListScreen> createState() => _BookListScreenState();
}

class _BookListScreenState extends State<BookListScreen> {
  @override
  void initState() {
    super.initState();
    // 화면 진입 시 도서 목록 패치 로직 호출
    Future.microtask(() {
      Provider.of<BookController>(context, listen: false).fetchBooks();
    });
  }

  @override
  Widget build(BuildContext context) {
    // Consumer 패턴을 통한 상태 구독 및 화면 리렌더링
    return Scaffold(
      appBar: AppBar(
        title: const Text('도서 검색'),
      ),
      body: Consumer<BookController>(
        builder: (context, controller, child) {
          if (controller.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (controller.bookList.isEmpty) {
            return const Center(child: Text('조회된 도서가 없습니다.'));
          }
          
          // 도서 목록 리스트뷰 렌더링
          return ListView.builder(
            itemCount: controller.bookList.length,
            itemBuilder: (context, index) {
              final book = controller.bookList[index];
              return ListTile(
                leading: const Icon(Icons.menu_book),
                title: Text(book.title ?? '제목 없음'),
                subtitle: Text(book.author ?? '저자 미상'),
                trailing: Text(book.status ?? '상태'),
                onTap: () {
                  // 상세 도서 화면으로 이동 처리
                  Navigator.pushNamed(context, '/bookDetail', arguments: book.id);
                },
              );
            },
          );
        },
      ),
    );
  }
}
