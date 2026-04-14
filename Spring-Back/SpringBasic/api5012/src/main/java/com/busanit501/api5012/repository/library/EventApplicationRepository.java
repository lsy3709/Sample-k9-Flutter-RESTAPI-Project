package com.busanit501.api5012.repository.library;

import com.busanit501.api5012.domain.library.EventApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * EventApplicationRepository - 행사 참가 신청 레포지토리
 *
 * EventApplication 엔티티에 대한 DB 접근 인터페이스입니다.
 * 회원별 신청 이력, 행사별 신청자 목록, 중복 신청 확인 등의 기능을 제공합니다.
 */
@Repository
public interface EventApplicationRepository extends JpaRepository<EventApplication, Long> {

    /**
     * findByMemberId - 회원 ID 로 신청 이력 조회 (페이징)
     * 마이페이지에서 내가 신청한 행사 목록을 표시할 때 사용합니다.
     *
     * @param memberId 조회할 회원 ID
     * @param pageable 페이징 정보
     * @return 해당 회원의 신청 이력 목록 (페이징)
     */
    Page<EventApplication> findByMemberId(Long memberId, Pageable pageable);

    /**
     * findAllByMemberId - 회원 ID 로 해당 회원의 모든 행사 신청을 조회 (List 반환)
     * 관리자 회원 삭제 시 연관 행사 신청 데이터를 정리하기 위해 사용합니다.
     *
     * @param memberId 조회할 회원 ID
     * @return 해당 회원의 전체 행사 신청 리스트
     */
    List<EventApplication> findAllByMemberId(Long memberId);

    /**
     * findByEventId - 행사 ID 로 신청자 목록 조회 (페이징)
     * 관리자 화면에서 특정 행사의 전체 신청자를 확인할 때 사용합니다.
     *
     * @param eventId  조회할 행사 ID
     * @param pageable 페이징 정보
     * @return 해당 행사의 신청자 목록 (페이징)
     */
    Page<EventApplication> findByEventId(Long eventId, Pageable pageable);

    /**
     * existsByEventIdAndMemberId - 특정 행사에 중복 신청 여부 확인
     * 행사 신청 전에 같은 회원이 이미 신청했는지 확인합니다.
     * 중복 신청을 방지하는 유효성 검증에 사용합니다.
     *
     * @param eventId  행사 ID
     * @param memberId 회원 ID
     * @return 이미 신청했으면 true, 처음 신청이면 false
     */
    boolean existsByEventIdAndMemberId(Long eventId, Long memberId);

    /**
     * findByEventIdAndMemberId - 특정 회원의 특정 행사 신청 기록 조회
     * 신청 취소 처리 시 해당 신청 기록을 조회합니다.
     *
     * @param eventId  행사 ID
     * @param memberId 회원 ID
     * @return 해당 신청 기록 (없으면 Optional.empty())
     */
    Optional<EventApplication> findByEventIdAndMemberId(Long eventId, Long memberId);

    /**
     * findByMemberIdAndStatus - 회원의 상태별 신청 이력 조회
     * APPLIED (신청완료) 또는 CANCELLED (취소) 상태별로 조회합니다.
     *
     * @param memberId 회원 ID
     * @param status   신청 상태 ("APPLIED" 또는 "CANCELLED")
     * @return 조건에 맞는 신청 이력 목록
     */
    List<EventApplication> findByMemberIdAndStatus(Long memberId, String status);

    /**
     * findByEventIdAndStatus - 행사별 상태별 신청 목록 조회
     * 특정 행사의 유효한 신청자(APPLIED) 또는 취소자(CANCELLED) 목록을 조회합니다.
     *
     * @param eventId 행사 ID
     * @param status  신청 상태
     * @return 조건에 맞는 신청 목록
     */
    List<EventApplication> findByEventIdAndStatus(Long eventId, String status);

    /**
     * countByEventIdAndStatus - 행사별 신청 건수 집계
     * 특정 행사의 유효한 신청 건수를 계산합니다.
     * LibraryEvent.currentParticipants 와 동기화 검증에 사용할 수 있습니다.
     *
     * @param eventId 행사 ID
     * @param status  집계할 신청 상태
     * @return 신청 건수
     */
    long countByEventIdAndStatus(Long eventId, String status);

    /**
     * deleteByEventId - 행사 ID 로 해당 행사의 모든 신청 기록 삭제
     * 행사 삭제 시 FK 제약 위반을 방지하기 위해 먼저 호출합니다.
     *
     * @param eventId 삭제할 행사 ID
     */
    void deleteByEventId(Long eventId);

    /**
     * findMemberApplicationsWithEventDetails - 회원의 신청 이력 (행사 정보 포함)
     * 마이페이지에서 신청한 행사의 제목, 날짜 등을 함께 표시합니다.
     * JOIN FETCH 로 N+1 문제를 방지합니다.
     *
     * @param memberId 회원 ID
     * @return 행사 정보가 포함된 신청 이력 목록
     */
    @Query("SELECT ea FROM EventApplication ea " +
           "JOIN FETCH ea.event e " +
           "JOIN FETCH ea.member m " +
           "WHERE m.id = :memberId " +
           "ORDER BY ea.applyDate DESC")
    List<EventApplication> findMemberApplicationsWithEventDetails(
            @Param("memberId") Long memberId);
}
