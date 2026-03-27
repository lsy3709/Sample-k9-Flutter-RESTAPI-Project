import 'package:flutter/material.dart';

/// 마이페이지 화면 (회원의 개인 정보, 대여 현황, 문의 내역 등)
class MyPageScreen extends StatelessWidget {
  const MyPageScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('마이페이지'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // 사용자 프로필 정보 영역
          const ListTile(
            leading: Icon(Icons.person, size: 40),
            title: Text('로그인된 사용자 (홍길동)'),
            subtitle: Text('test@example.com'),
          ),
          const Divider(),
          // 내 대여 기록 메뉴 이동 액션
          ListTile(
            leading: const Icon(Icons.book),
            title: const Text('내 대여 내역 보기'),
            onTap: () {
              Navigator.pushNamed(context, '/rentalList');
            },
          ),
          // 1:1 문의 내역 이동 액션
          ListTile(
            leading: const Icon(Icons.question_answer),
            title: const Text('1:1 문의 내역'),
            onTap: () {
              Navigator.pushNamed(context, '/inquiryList');
            },
          ),
          // 로그아웃 액션
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('로그아웃'),
            onTap: () {
              // TODO: Provider 상태 초기화 로직 구현 필요
              Navigator.pushReplacementNamed(context, '/login');
            },
          ),
        ],
      ),
    );
  }
}
