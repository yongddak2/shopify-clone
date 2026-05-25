package com.pantrka.backend.domain.notice.controller;

import com.pantrka.backend.domain.notice.dto.NoticeCreateRequest;
import com.pantrka.backend.domain.notice.dto.NoticeDetailResponse;
import com.pantrka.backend.domain.notice.dto.NoticeListResponse;
import com.pantrka.backend.domain.notice.dto.NoticeUpdateRequest;
import com.pantrka.backend.domain.notice.service.AdminNoticeService;
import com.pantrka.backend.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/notices")
@RequiredArgsConstructor
@Tag(name = "Admin Notice", description = "관리자 공지사항 API")
public class AdminNoticeController {

    private final AdminNoticeService adminNoticeService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<NoticeListResponse>>> getNotices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success(adminNoticeService.getNotices(page, size, keyword)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NoticeDetailResponse>> getNotice(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminNoticeService.getNotice(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<NoticeDetailResponse>> createNotice(
            @Valid @RequestBody NoticeCreateRequest request) {
        NoticeDetailResponse response = adminNoticeService.createNotice(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<NoticeDetailResponse>> updateNotice(
            @PathVariable Long id,
            @Valid @RequestBody NoticeUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(adminNoticeService.updateNotice(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotice(@PathVariable Long id) {
        adminNoticeService.deleteNotice(id);
        return ResponseEntity.noContent().build();
    }
}
