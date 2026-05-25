package com.pantrka.backend.domain.notice.dto;

import com.pantrka.backend.domain.notice.entity.Notice;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NoticeListResponse {

    private final Long id;
    private final String title;
    private final boolean pinned;
    private final LocalDateTime createdAt;

    public static NoticeListResponse from(Notice notice) {
        return NoticeListResponse.builder()
                .id(notice.getId())
                .title(notice.getTitle())
                .pinned(notice.isPinned())
                .createdAt(notice.getCreatedAt())
                .build();
    }
}
