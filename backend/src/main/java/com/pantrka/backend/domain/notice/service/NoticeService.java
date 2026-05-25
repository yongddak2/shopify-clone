package com.pantrka.backend.domain.notice.service;

import com.pantrka.backend.domain.notice.dto.NoticeDetailResponse;
import com.pantrka.backend.domain.notice.dto.NoticeListResponse;
import com.pantrka.backend.domain.notice.entity.Notice;
import com.pantrka.backend.domain.notice.repository.NoticeRepository;
import com.pantrka.backend.global.exception.BusinessException;
import com.pantrka.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeService {

    private final NoticeRepository noticeRepository;

    public Page<NoticeListResponse> getNotices(int page, int size) {
        return noticeRepository.findPublicNotices(PageRequest.of(page, size))
                .map(NoticeListResponse::from);
    }

    @Transactional
    public NoticeDetailResponse getNotice(Long id) {
        Notice notice = noticeRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTICE_NOT_FOUND));
        notice.increaseViewCount();

        Notice prev = noticeRepository
                .findFirstByDeletedAtIsNullAndCreatedAtLessThanOrderByCreatedAtDesc(notice.getCreatedAt())
                .orElse(null);
        Notice next = noticeRepository
                .findFirstByDeletedAtIsNullAndCreatedAtGreaterThanOrderByCreatedAtAsc(notice.getCreatedAt())
                .orElse(null);

        return NoticeDetailResponse.from(notice, prev, next);
    }
}
