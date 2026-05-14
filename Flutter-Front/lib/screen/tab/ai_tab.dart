import 'package:flutter/material.dart';

/// AI 기능 탭
/// Gemini 멀티모달 기능 4종 + 기존 AI 기능 2종
class AiTab extends StatelessWidget {
  const AiTab({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const SizedBox(height: 4),
        // ── Gemini AI 섹션 헤더
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 10),
          child: Row(
            children: [
              Container(
                width: 4,
                height: 18,
                decoration: BoxDecoration(
                  color: const Color(0xFF5E35B1),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              const Text('Gemini AI 멀티모달',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold,
                      color: Color(0xFF5E35B1))),
            ],
          ),
        ),
        _AiFeatureCard(
          icon: Icons.chat_bubble_outline,
          color: const Color(0xFF5E35B1),
          title: 'Gemini 텍스트 챗봇',
          description: '질문을 입력하면 Gemini가 한국어로\n답변을 생성합니다.',
          onTap: () => Navigator.pushNamed(context, '/ai-chat'),
        ),
        const SizedBox(height: 12),
        _AiFeatureCard(
          icon: Icons.auto_fix_high,
          color: const Color(0xFF1565C0),
          title: 'Gemini 이미지 분석',
          description: '이미지를 선택하면 Gemini Vision이\n내용을 한국어로 설명합니다.',
          onTap: () => Navigator.pushNamed(context, '/gemini-image'),
        ),
        const SizedBox(height: 12),
        _AiFeatureCard(
          icon: Icons.contact_page_outlined,
          color: const Color(0xFF6A1B9A),
          title: '명함 OCR · 회원 검색',
          description: '명함을 촬영하면 정보를 추출하고\nDB에서 일치하는 회원을 검색합니다.',
          onTap: () => Navigator.pushNamed(context, '/gemini-business-card'),
        ),
        const SizedBox(height: 12),
        _AiFeatureCard(
          icon: Icons.quiz_outlined,
          color: const Color(0xFF00695C),
          title: '이미지 Q&A (멀티모달)',
          description: '이미지와 질문을 함께 보내면\nGemini가 이미지 내용을 참고해 답변합니다.',
          onTap: () => Navigator.pushNamed(context, '/gemini-multimodal'),
        ),
        const SizedBox(height: 20),

        // ── 기타 AI 섹션 헤더
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 10),
          child: Row(
            children: [
              Container(
                width: 4,
                height: 18,
                decoration: BoxDecoration(
                  color: Colors.grey[600],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              Text('기타 AI 서비스',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold,
                      color: Colors.grey[700])),
            ],
          ),
        ),
        _AiFeatureCard(
          icon: Icons.image_search,
          color: const Color(0xFF1565C0),
          title: 'AI 이미지 분류',
          description: '이미지를 업로드하면 AI 모델이 내용을 분석하고\n결과를 알려드립니다.',
          onTap: () => Navigator.pushNamed(context, '/ai-image'),
        ),
        const SizedBox(height: 12),
        _AiFeatureCard(
          icon: Icons.show_chart,
          color: const Color(0xFF2E7D32),
          title: 'AI 주가 예측',
          description: '삼성전자 주가 데이터를 기반으로\nAI가 미래 주가를 예측합니다.',
          onTap: () => Navigator.pushNamed(context, '/ai-stock'),
        ),
        const SizedBox(height: 8),
      ],
    );
  }
}

class _AiFeatureCard extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title;
  final String description;
  final VoidCallback onTap;

  const _AiFeatureCard({
    required this.icon,
    required this.color,
    required this.title,
    required this.description,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Row(
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(icon, color: color, size: 32),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: const TextStyle(
                            fontSize: 17, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text(description,
                        style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[600],
                            height: 1.4)),
                  ],
                ),
              ),
              Icon(Icons.arrow_forward_ios, color: Colors.grey[400], size: 16),
            ],
          ),
        ),
      ),
    );
  }
}
