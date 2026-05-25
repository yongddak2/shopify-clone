package com.pantrka.backend.domain.faq.controller;

import com.pantrka.backend.domain.faq.dto.FaqResponse;
import com.pantrka.backend.domain.faq.service.FaqService;
import com.pantrka.backend.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/faqs")
@RequiredArgsConstructor
@Tag(name = "FAQ", description = "자주 묻는 질문 API")
public class FaqController {

    private final FaqService faqService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FaqResponse>>> getFaqs() {
        return ResponseEntity.ok(ApiResponse.success(faqService.getFaqs()));
    }
}
