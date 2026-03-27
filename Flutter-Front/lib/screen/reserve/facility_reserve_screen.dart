import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../controller/reserve_controller.dart';

/// 도서관 열람실/스터디룸 등 시설을 예약하기 위한 폼 스크린
class FacilityReserveScreen extends StatefulWidget {
  const FacilityReserveScreen({super.key});

  @override
  State<FacilityReserveScreen> createState() => _FacilityReserveScreenState();
}

class _FacilityReserveScreenState extends State<FacilityReserveScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      Provider.of<ReserveController>(context, listen: false).fetchReservations();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('도서관 시설 예약'),
      ),
      body: Consumer<ReserveController>(
        builder: (context, controller, child) {
          if (controller.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          return Column(
            children: [
              const Padding(
                padding: EdgeInsets.all(16.0),
                child: Text('시설 예약 현황 안내 레이아웃이 여기에 구현됩니다.'),
              ),
              Expanded(
                child: ListView.builder(
                  itemCount: controller.reservationList.length,
                  itemBuilder: (context, index) {
                    final item = controller.reservationList[index];
                    return ListTile(
                      title: Text(item.facilityName ?? '미확인 시설'),
                      trailing: Text(item.status ?? '상태'),
                    );
                  },
                ),
              ),
              const Padding(
                padding: EdgeInsets.all(16.0),
                child: Text('예약 신청 버튼 및 날짜 선택기 추가 예정'),
              )
            ],
          );
        },
      ),
    );
  }
}
