package com.pantrka.backend.domain.notice.service;

import com.pantrka.backend.domain.notice.dto.NoticeCreateRequest;
import com.pantrka.backend.domain.notice.dto.NoticeDetailResponse;
import com.pantrka.backend.domain.notice.dto.NoticeListResponse;
import com.pantrka.backend.domain.notice.dto.NoticeUpdateRequest;
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
public class AdminNoticeService {

    private final NoticeRepository noticeRepository;

    public Page<NoticeListResponse> getNotices(int page, int size, String keyword) {
        String normalized = (keyword == null || keyword.isBlank()) ? "" : keyword.trim();
        return noticeRepository.findAdminNotices(normalized, PageRequest.of(page, size))
                .map(NoticeListResponse::from);
    }

    public NoticeDetailResponse getNotice(Long id) {
        Notice notice = noticeRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTICE_NOT_FOUND));
        return NoticeDetailResponse.from(notice);
    }

    @Transactional
    public NoticeDetailResponse createNotice(NoticeCreateRequest request) {
        Notice notice = Notice.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .isPinned(request.isPinned())
                .build();
        return NoticeDetailResponse.from(noticeRepository.save(notice));
    }

    @Transactional
    public NoticeDetailResponse updateNotice(Long id, NoticeUpdateRequest request) {
        Notice notice = noticeRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTICE_NOT_FOUND));
        notice.update(request.getTitle(), request.getContent(), request.isPinned());
        return NoticeDetailResponse.from(notice);
    }

    @Transactional
    public void deleteNotice(Long id) {
        Notice notice = noticeRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTICE_NOT_FOUND));
        notice.markDeleted();
    }
}
