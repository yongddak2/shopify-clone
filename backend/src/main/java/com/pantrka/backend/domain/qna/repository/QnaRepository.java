package com.pantrka.backend.domain.qna.repository;

import com.pantrka.backend.domain.qna.entity.Qna;
import com.pantrka.backend.global.common.SupportCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface QnaRepository extends JpaRepository<Qna, Long> {

    @EntityGraph(attributePaths = {"member"})
    Optional<Qna> findByIdAndDeletedAtIsNull(Long id);

    @EntityGraph(attributePaths = {"member"})
    @Query("SELECT q FROM Qna q WHERE q.deletedAt IS NULL " +
            "AND (:category IS NULL OR q.category = :category) " +
            "ORDER BY q.createdAt DESC")
    Page<Qna> findPublicQnas(@Param("category") SupportCategory category, Pageable pageable);

    @EntityGraph(attributePaths = {"member"})
    @Query("SELECT q FROM Qna q WHERE q.deletedAt IS NULL " +
            "AND (:category IS NULL OR q.category = :category) " +
            "AND (:answered IS NULL " +
            "     OR (:answered = TRUE AND q.answer IS NOT NULL) " +
            "     OR (:answered = FALSE AND q.answer IS NULL)) " +
            "AND LOWER(q.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "ORDER BY q.createdAt DESC")
    Page<Qna> findAdminQnas(@Param("keyword") String keyword,
                            @Param("category") SupportCategory category,
                            @Param("answered") Boolean answered,
                            Pageable pageable);

    @Query("SELECT COUNT(q) FROM Qna q WHERE q.deletedAt IS NULL AND q.answer IS NULL")
    long countUnanswered();

    @EntityGraph(attributePaths = {"member"})
    Page<Qna> findByMemberIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long memberId, Pageable pageable);
}
