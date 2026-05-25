package com.pantrka.backend.domain.notice.repository;

import com.pantrka.backend.domain.notice.entity.Notice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

    Optional<Notice> findByIdAndDeletedAtIsNull(Long id);

    @Query("SELECT n FROM Notice n WHERE n.deletedAt IS NULL " +
            "ORDER BY n.isPinned DESC, n.createdAt DESC")
    Page<Notice> findPublicNotices(Pageable pageable);

    @Query("SELECT n FROM Notice n WHERE n.deletedAt IS NULL " +
            "AND LOWER(n.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "ORDER BY n.isPinned DESC, n.createdAt DESC")
    Page<Notice> findAdminNotices(@Param("keyword") String keyword, Pageable pageable);
}
