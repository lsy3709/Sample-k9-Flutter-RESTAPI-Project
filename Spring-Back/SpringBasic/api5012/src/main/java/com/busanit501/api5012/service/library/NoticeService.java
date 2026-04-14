package com.busanit501.api5012.service.library;

import com.busanit501.api5012.dto.library.NoticeDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * NoticeService - 공지사항 서비스 인터페이스
 *
 * 부산도서관 관리 시스템의 공지사항 비즈니스 로직을 정의합니다.
 * 상단 고정(topFixed) 공지사항을 일반 공지사항보다 우선 표시하는 기능을 포함합니다.
 *
 * [공지사항 목록 정렬 규칙]
 * 1순위: topFixed = true 인 공지사항 (최신순)
 * 2순위: topFixed = false 인 일반 공지사항 (최신순)
 *
 * [이미지 처리]
 * 공지사항에는 여러 장의 이미지를 첨부할 수 있습니다.
 * 목록 조회 시에는 이미지를 제외하고, 상세 조회 시에만 이미지를 포함합니다.
 */
public interface NoticeService {

    /**
     * getNotices - 공지사항 목록 조회 (상단 고정 우선)
     *
     * 상단 고정 공지를 페이지 첫 항목에 포함하여 반환합니다.
     *
     * @param pageable 페이지 정보
     * @return 페이지네이션이 적용된 공지사항 목록
     */
    Page<NoticeDTO> getNotices(Pageable pageable);

    /**
     * getNotices - 키워드 검색 + 공지사항 목록 조회
     *
     * keyword 가 있으면 제목/내용/작성자 통합 검색, 없으면 전체 조회(상단고정 우선)
     *
     * @param keyword  검색 키워드 (null 또는 빈 문자열이면 전체 조회)
     * @param pageable 페이지 정보
     * @return 페이지네이션이 적용된 공지사항 목록
     */
    Page<NoticeDTO> getNotices(String keyword, Pageable pageable);

    /**
     * getNoticeById - 공지사항 상세 조회 (이미지 포함)
     *
     * JOIN FETCH 를 사용하여 이미지도 함께 로딩합니다.
     *
     * @param id 조회할 공지사항 기본키
     * @return 이미지가 포함된 공지사항 상세 DTO
     * @throws RuntimeException 해당 ID의 공지사항이 없을 때
     */
    NoticeDTO getNoticeById(Long id);

    /**
     * createNotice - 공지사항 등록 (관리자 전용)
     *
     * 새 공지사항을 등록합니다.
     * 이미지 파일명 목록이 있으면 NoticeImage 엔티티도 함께 저장합니다.
     *
     * @param dto 등록할 공지사항 정보 (제목, 내용, 작성자, 상단고정여부, 이미지 목록)
     * @return 등록된 공지사항의 ID
     */
    Long createNotice(NoticeDTO dto);

    /**
     * updateNotice - 공지사항 수정 (관리자 전용)
     *
     * 제목, 내용, 상단고정 여부를 수정합니다.
     * 이미지 수정 시에는 기존 이미지를 전부 삭제하고 새 이미지를 추가합니다.
     *
     * @param id  수정할 공지사항 기본키
     * @param dto 수정할 공지사항 정보
     * @throws RuntimeException 해당 ID의 공지사항이 없을 때
     */
    void updateNotice(Long id, NoticeDTO dto);

    /**
     * deleteNotice - 공지사항 삭제 (관리자 전용)
     *
     * 공지사항과 첨부 이미지(cascade)를 함께 삭제합니다.
     *
     * @param id 삭제할 공지사항 기본키
     * @throws RuntimeException 해당 ID의 공지사항이 없을 때
     */
    void deleteNotice(Long id);
}
