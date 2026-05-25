package com.pantrka.backend.domain.answertemplate.controller;

import com.pantrka.backend.domain.answertemplate.dto.AnswerTemplateRequest;
import com.pantrka.backend.domain.answertemplate.dto.AnswerTemplateResponse;
import com.pantrka.backend.domain.answertemplate.service.AnswerTemplateService;
import com.pantrka.backend.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/answer-templates")
@RequiredArgsConstructor
@Tag(name = "Admin Answer Template", description = "관리자 답변 템플릿 API")
public class AnswerTemplateController {

    private final AnswerTemplateService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AnswerTemplateResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AnswerTemplateResponse>> create(
            @Valid @RequestBody AnswerTemplateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.create(request)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<AnswerTemplateResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody AnswerTemplateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
