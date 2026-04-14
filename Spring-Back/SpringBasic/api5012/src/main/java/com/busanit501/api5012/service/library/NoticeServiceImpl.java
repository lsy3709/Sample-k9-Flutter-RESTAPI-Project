package com.busanit501.api5012.service.library;

import com.busanit501.api5012.domain.library.Notice;
import com.busanit501.api5012.domain.library.NoticeImage;
import com.busanit501.api5012.dto.library.NoticeDTO;
import com.busanit501.api5012.repository.library.NoticeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * NoticeServiceImpl - 공지사항 서비스 구현체
 *
 * NoticeService 인터페이스의 구현 클래스입니다.
 * 상단 고정 공지를 일반 공지 앞에 배치하는 목록 조회 기능을 포함합니다.
 *
 * [공지사항 목록 구성]
 * 1. 상단 고정 공지 (topFixed = true) 를 먼저 조회 → 항상 최상단 표시
 * 2. 일반 공지 (topFixed = false) 를 페이지네이션으로 조회
 * 3. 두 목록을 합쳐 PageImpl 로 반환
 *
 * [NoticeImage 처리]
 * - 공지사항 등록/수정 시 NoticeDTO 의 images 리스트에 이미지 파일명이 포함됩니다.
 * - Notice.addImage() 도메인 메서드로 NoticeImage 를 추가하면
 *   cascade=ALL 설정에 의해 자동으로 DB에 저장됩니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeServiceImpl implements NoticeService {

    /** NoticeRepository - 공지사항 엔티티에 대한 DB 접근 */
    private final NoticeRepository noticeRepository;

    /**
     * getNotices - 공지사항 목록 조회 (상단 고정 우선)
     *
     * 상단 고정 공지를 페이지 첫 항목에 항상 포함합니다.
     * 일반 공지는 페이지네이션이 적용됩니다.
     *
     * [PageImpl 설명]
     * PageImpl 은 Page 인터페이스의 구현체로,
     * 직접 생성할 때 (List<T>, Pageable, totalElements) 를 전달합니다.
     */
    @Override
    public Page<NoticeDTO> getNotices(Pageable pageable) {
        return getNotices(null, pageable);
    }

    @Override
    public Page<NoticeDTO> getNotices(String keyword, Pageable pageable) {
        log.info("공지사항 목록 조회 - keyword: {}, page: {}", keyword, pageable.getPageNumber());

        // 키워드가 있으면 통합 검색 (상단고정 구분 없이 제목/내용/작성자 검색)
        if (keyword != null && !keyword.isBlank()) {
            Page<Notice> searchPage = noticeRepository.searchByKeyword(keyword, pageable);
            return searchPage.map(NoticeDTO::fromEntityWithoutImages);
        }

        // 키워드 없음: 상단 고정 우선 + 일반 공지 페이지네이션
        List<Notice> topNotices = noticeRepository.findByTopFixedTrueOrderByRegDateDesc();
        Page<Notice> normalNoticePage = noticeRepository.findByTopFixedFalseOrderByRegDateDesc(pageable);

        List<NoticeDTO> combinedList = new ArrayList<>();
        topNotices.forEach(notice ->
                combinedList.add(NoticeDTO.fromEntityWithoutImages(notice)));
        normalNoticePage.getContent().forEach(notice ->
                combinedList.add(NoticeDTO.fromEntityWithoutImages(notice)));

        long total = topNotices.size() + normalNoticePage.getTotalElements();
        return new PageImpl<>(combinedList, pageable, total);
    }

    /**
     * getNoticeById - 공지사항 상세 조회 (이미지 포함)
     *
     * findWithImagesById() 는 JOIN FETCH 를 사용하여 이미지를 한 번에 로딩합니다.
     * LAZY 로딩인 images 컬렉션을 명시적으로 FETCH 합니다.
     */
    @Override
    public NoticeDTO getNoticeById(Long id) {
        log.info("공지사항 상세 조회 - noticeId: {}", id);

        // JOIN FETCH 쿼리로 이미지까지 한 번에 로딩 (N+1 방지)
        Notice notice = noticeRepository.findWithImagesById(id)
                .orElseThrow(() -> new RuntimeException("공지사항을 찾을 수 없습니다. id: " + id));

        // 이미지 포함 DTO 변환
        return NoticeDTO.fromEntity(notice);
    }

    /**
     * createNotice - 공지사항 등록 (관리자 전용)
     *
     * NoticeDTO 의 images 리스트를 순회하여 NoticeImage 를 추가합니다.
     * Notice.addImage() 도메인 메서드를 사용하면 양방향 관계가 자동으로 설정됩니다.
     */
    @Override
    @Transactional
    public Long createNotice(NoticeDTO dto) {
        log.info("공지사항 등록 시작 - 제목: {}", dto.getTitle());

        // Notice 엔티티 생성 (빌더 패턴)
        Notice notice = Notice.builder()
                .title(dto.getTitle())
                .content(dto.getContent())
                .writer(dto.getWriter())
                .topFixed(dto.isTopFixed())
                .build();

        // 이미지 정보가 있으면 NoticeImage 추가
        if (dto.getImages() != null && !dto.getImages().isEmpty()) {
            dto.getImages().forEach(imageDTO -> {
                // NoticeImage 엔티티 생성 (fileName, uuid, ord 필드 사용)
                NoticeImage noticeImage = NoticeImage.builder()
                        .fileName(imageDTO.getFileName())
                        .uuid(imageDTO.getUuid() != null ? imageDTO.getUuid() : "")
                        .ord(imageDTO.getOrd())
                        .build();
                // Notice.addImage() 로 양방향 관계 설정 후 추가
                notice.addImage(noticeImage);
            });
            log.debug("첨부 이미지 {}장 추가", dto.getImages().size());
        }

        Long savedId = noticeRepository.save(notice).getId();
        log.info("공지사항 등록 완료 - noticeId: {}", savedId);

        return savedId;
    }

    /**
     * updateNotice - 공지사항 수정 (관리자 전용)
     *
     * 제목, 내용, 상단고정 여부를 수정합니다.
     * 이미지는 전체 삭제 후 새로 추가하는 방식(Replace)을 사용합니다.
     *
     * [orphanRemoval = true 동작]
     * Notice.clearImages() 로 images 컬렉션을 비우면,
     * orphanRemoval 설정에 의해 DB 에서도 자동 DELETE 됩니다.
     */
    @Override
    @Transactional
    public void updateNotice(Long id, NoticeDTO dto) {
        log.info("공지사항 수정 시작 - noticeId: {}", id);

        Notice notice = noticeRepository.findWithImagesById(id)
                .orElseThrow(() -> new RuntimeException("공지사항을 찾을 수 없습니다. id: " + id));

        // 도메인 메서드로 필드 수정 (더티체킹으로 자동 UPDATE)
        notice.changeTitle(dto.getTitle());
        notice.changeContent(dto.getContent());
        notice.changeTopFixed(dto.isTopFixed());

        // 이미지 교체: 기존 이미지 전체 삭제 후 새 이미지 추가
        notice.clearImages(); // orphanRemoval=true 로 DB에서도 자동 삭제

        if (dto.getImages() != null && !dto.getImages().isEmpty()) {
            dto.getImages().forEach(imageDTO -> {
                NoticeImage noticeImage = NoticeImage.builder()
                        .fileName(imageDTO.getFileName())
                        .uuid(imageDTO.getUuid() != null ? imageDTO.getUuid() : "")
                        .ord(imageDTO.getOrd())
                        .build();
                notice.addImage(noticeImage);
            });
        }

        log.info("공지사항 수정 완료 - noticeId: {}", id);
    }

    /**
     * deleteNotice - 공지사항 삭제
     *
     * findWithImagesById 로 이미지 컬렉션을 함께 로딩한 뒤 삭제합니다.
     * LAZY 컬렉션을 먼저 초기화해야 cascade = ALL 이 자식 엔티티까지
     * 확실히 전파되어 FK 제약 위반이 발생하지 않습니다.
     */
    @Override
    @Transactional
    public void deleteNotice(Long id) {
        log.info("공지사항 삭제 시작 - noticeId: {}", id);

        Notice notice = noticeRepository.findWithImagesById(id)
                .orElseThrow(() -> new RuntimeException("공지사항을 찾을 수 없습니다. id: " + id));

        // cascade=ALL 로 연관된 이미지도 함께 삭제됩니다.
        noticeRepository.delete(notice);

        log.info("공지사항 삭제 완료 - noticeId: {}", id);
    }
}
