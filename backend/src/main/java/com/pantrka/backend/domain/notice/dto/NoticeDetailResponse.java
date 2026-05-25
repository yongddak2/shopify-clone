package com.pantrka.backend.domain.notice.dto;

import com.pantrka.backend.domain.notice.entity.Notice;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NoticeDetailResponse {

    private final Long id;
    private final String title;
    private final String content;
    private final boolean pinned;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public static NoticeDetailResponse from(Notice notice) {
        return NoticeDetailResponse.builder()
                .id(notice.getId())
                .title(notice.getTitle())
                .content(notice.getContent())
                .pinned(notice.isPinned())
                .createdAt(notice.getCreatedAt())
                .updatedAt(notice.getUpdatedAt())
                .build();
    }
}
