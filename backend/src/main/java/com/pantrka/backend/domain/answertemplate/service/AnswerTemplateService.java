package com.pantrka.backend.domain.answertemplate.service;

import com.pantrka.backend.domain.answertemplate.dto.AnswerTemplateRequest;
import com.pantrka.backend.domain.answertemplate.dto.AnswerTemplateResponse;
import com.pantrka.backend.domain.answertemplate.entity.AnswerTemplate;
import com.pantrka.backend.domain.answertemplate.repository.AnswerTemplateRepository;
import com.pantrka.backend.global.exception.BusinessException;
import com.pantrka.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnswerTemplateService {

    private final AnswerTemplateRepository repository;

    public List<AnswerTemplateResponse> getAll() {
        return repository.findAllByOrderBySortOrderAscIdAsc().stream()
                .map(AnswerTemplateResponse::from)
                .toList();
    }

    @Transactional
    public AnswerTemplateResponse create(AnswerTemplateRequest request) {
        int next = repository.findAllByOrderBySortOrderAscIdAsc().stream()
                .mapToInt(AnswerTemplate::getSortOrder).max().orElse(-1) + 1;
        AnswerTemplate saved = repository.save(AnswerTemplate.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .sortOrder(next)
                .build());
        return AnswerTemplateResponse.from(saved);
    }

    @Transactional
    public AnswerTemplateResponse update(Long id, AnswerTemplateRequest request) {
        AnswerTemplate t = repository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ANSWER_TEMPLATE_NOT_FOUND));
        t.update(request.getTitle(), request.getContent());
        return AnswerTemplateResponse.from(t);
    }

    @Transactional
    public void delete(Long id) {
        AnswerTemplate t = repository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ANSWER_TEMPLATE_NOT_FOUND));
        repository.delete(t);
    }
}
