package com.busanit501.api5012.controller.library;

import com.busanit501.api5012.dto.library.NoticeDTO;
import com.busanit501.api5012.service.library.NoticeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * NoticeController - 공지사항 REST 컨트롤러
 *
 * 부산도서관 관리 시스템의 공지사항 관련 API 엔드포인트를 제공합니다.
 * 기본 경로: /api/notice/
 *
 * [공지사항 목록 특징]
 * 상단 고정(topFixed=true) 공지사항이 일반 공지보다 먼저 표시됩니다.
 * NoticeServiceImpl 의 getNotices() 에서 이 정렬을 처리합니다.
 *
 * [이미지 첨부]
 * 공지사항 상세 조회 시 첨부 이미지 목록(images)이 포함됩니다.
 * 목록 조회 시에는 이미지 없이 제목과 작성자만 반환됩니다.
 */
@Slf4j
@RestController
@RequestMapping("/api/notice")
@RequiredArgsConstructor
@Tag(name = "공지사항 API", description = "공지사항 목록 조회, 상세 조회, 등록/수정/삭제 API")
public class NoticeController {

    /** NoticeService - 공지사항 비즈니스 로직 서비스 */
    private final NoticeService noticeService;

    // ──────────────────────────────────────────────────────
    // GET /api/notice  →  공지사항 목록
    // ──────────────────────────────────────────────────────

    /**
     * getNotices - 공지사항 목록 조회 (상단 고정 우선)
     *
     * 상단 고정 공지 → 일반 공지 순으로 반환합니다.
     *
     * @param page 페이지 번호 (0부터 시작)
     * @param size 페이지 크기
     * @return 200 OK + Page<NoticeDTO>
     */
    @GetMapping
    @Operation(summary = "공지사항 목록", description = "상단 고정 공지를 우선하여 공지사항 목록을 반환합니다. keyword 파라미터로 제목/내용/작성자 검색 가능.")
    public ResponseEntity<Page<NoticeDTO>> getNotices(
            @Parameter(description = "검색 키워드 (제목/내용/작성자)")
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("공지사항 목록 조회 요청 - keyword: {}, page: {}, size: {}", keyword, page, size);

        Pageable pageable = PageRequest.of(page, size);
        Page<NoticeDTO> noticePage = noticeService.getNotices(keyword, pageable);
        return ResponseEntity.ok(noticePage);
    }

    // ──────────────────────────────────────────────────────
    // GET /api/notice/{id}  →  공지사항 상세 (이미지 포함)
    // ──────────────────────────────────────────────────────

    /**
     * getNoticeById - 공지사항 상세 조회 (이미지 포함)
     *
     * @param id 조회할 공지사항 기본키
     * @return 200 OK + NoticeDTO (images 포함)
     */
    @GetMapping("/{id}")
    @Operation(summary = "공지사항 상세 조회", description = "첨부 이미지를 포함한 공지사항 상세 정보를 반환합니다.")
    public ResponseEntity<Object> getNoticeById(
            @Parameter(description = "공지사항 기본키")
            @PathVariable Long id) {
        log.info("공지사항 상세 조회 요청 - noticeId: {}", id);

        try {
            NoticeDTO noticeDTO = noticeService.getNoticeById(id);
            return ResponseEntity.ok(noticeDTO);
        } catch (RuntimeException e) {
            log.warn("공지사항 조회 실패 - noticeId: {}, 오류: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("result", "error", "message", e.getMessage()));
        }
    }

    // ──────────────────────────────────────────────────────
    // POST /api/notice  →  공지사항 등록 (관리자)
    // ──────────────────────────────────────────────────────

    /**
     * createNotice - 공지사항 등록 (관리자 전용)
     *
     * 이미지 정보는 NoticeDTO.images 에 포함하여 전달합니다.
     *
     * @param dto 등록할 공지사항 정보
     * @return 201 Created + { "noticeId": 1 }
     */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "공지사항 등록 (관리자)", description = "새 공지사항을 등록합니다. 이미지 첨부 가능.")
    public ResponseEntity<Map<String, Object>> createNotice(@RequestBody NoticeDTO dto) {
        log.info("공지사항 등록 요청 - 제목: {}", dto.getTitle());

        try {
            Long noticeId = noticeService.createNotice(dto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("result", "success", "noticeId", noticeId));
        } catch (Exception e) {
            log.warn("공지사항 등록 실패 - {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("result", "error", "message", e.getMessage()));
        }
    }

    // ──────────────────────────────────────────────────────
    // PUT /api/notice/{id}  →  공지사항 수정
    // ──────────────────────────────────────────────────────

    /**
     * updateNotice - 공지사항 수정 (관리자 전용)
     *
     * @param id  수정할 공지사항 기본키
     * @param dto 수정할 공지사항 정보
     * @return 200 OK + { "result": "success" }
     */
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "공지사항 수정 (관리자)", description = "공지사항 제목, 내용, 상단고정 여부를 수정합니다.")
    public ResponseEntity<Map<String, String>> updateNotice(
            @PathVariable Long id,
            @RequestBody NoticeDTO dto) {
        log.info("공지사항 수정 요청 - noticeId: {}", id);

        try {
            noticeService.updateNotice(id, dto);
            return ResponseEntity.ok(Map.of("result", "success", "message", "공지사항이 수정되었습니다."));
        } catch (RuntimeException e) {
            log.warn("공지사항 수정 실패 - noticeId: {}, 오류: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("result", "error", "message", e.getMessage()));
        }
    }

    // ──────────────────────────────────────────────────────
    // DELETE /api/notice/{id}  →  공지사항 삭제
    // ──────────────────────────────────────────────────────

    /**
     * deleteNotice - 공지사항 삭제 (관리자 전용)
     *
     * 첨부 이미지도 함께 삭제됩니다 (cascade = ALL).
     *
     * @param id 삭제할 공지사항 기본키
     * @return 200 OK + { "result": "success" }
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "공지사항 삭제 (관리자)", description = "공지사항과 첨부 이미지를 함께 삭제합니다.")
    public ResponseEntity<Map<String, String>> deleteNotice(@PathVariable Long id) {
        log.info("공지사항 삭제 요청 - noticeId: {}", id);

        try {
            noticeService.deleteNotice(id);
            return ResponseEntity.ok(Map.of("result", "success", "message", "공지사항이 삭제되었습니다."));
        } catch (RuntimeException e) {
            log.warn("공지사항 삭제 실패 - noticeId: {}, 오류: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("result", "error", "message", e.getMessage()));
        }
    }
}
