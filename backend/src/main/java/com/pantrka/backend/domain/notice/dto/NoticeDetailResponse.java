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
    private final Long viewCount;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final NoticeNavigation prev;
    private final NoticeNavigation next;

    public record NoticeNavigation(Long id, String title) {
        public static NoticeNavigation from(Notice notice) {
            return notice == null ? null : new NoticeNavigation(notice.getId(), notice.getTitle());
        }
    }

    public static NoticeDetailResponse from(Notice notice) {
        return from(notice, null, null);
    }

    public static NoticeDetailResponse from(Notice notice, Notice prev, Notice next) {
        return NoticeDetailResponse.builder()
                .id(notice.getId())
                .title(notice.getTitle())
                .content(notice.getContent())
                .pinned(notice.isPinned())
                .viewCount(notice.getViewCount())
                .createdAt(notice.getCreatedAt())
                .updatedAt(notice.getUpdatedAt())
                .prev(NoticeNavigation.from(prev))
                .next(NoticeNavigation.from(next))
                .build();
    }
}
