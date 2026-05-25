package com.pantrka.backend.domain.faq.service;

import com.pantrka.backend.domain.faq.dto.FaqCreateRequest;
import com.pantrka.backend.domain.faq.dto.FaqResponse;
import com.pantrka.backend.domain.faq.dto.FaqSortRequest;
import com.pantrka.backend.domain.faq.dto.FaqUpdateRequest;
import com.pantrka.backend.domain.faq.entity.Faq;
import com.pantrka.backend.domain.faq.repository.FaqRepository;
import com.pantrka.backend.global.exception.BusinessException;
import com.pantrka.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminFaqService {

    private final FaqRepository faqRepository;

    public List<FaqResponse> getFaqs() {
        return faqRepository.findAllByOrderByCategoryAscSortOrderAscIdAsc().stream()
                .map(FaqResponse::from)
                .toList();
    }

    @Transactional
    public FaqResponse createFaq(FaqCreateRequest request) {
        // 신규 항목은 해당 카테고리 마지막에 위치
        int nextSortOrder = faqRepository.findAllByOrderByCategoryAscSortOrderAscIdAsc().stream()
                .filter(f -> f.getCategory() == request.getCategory())
                .mapToInt(Faq::getSortOrder)
                .max()
                .orElse(-1) + 1;

        Faq faq = Faq.builder()
                .category(request.getCategory())
                .question(request.getQuestion())
                .answer(request.getAnswer())
                .sortOrder(nextSortOrder)
                .build();
        return FaqResponse.from(faqRepository.save(faq));
    }

    @Transactional
    public FaqResponse updateFaq(Long id, FaqUpdateRequest request) {
        Faq faq = faqRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.FAQ_NOT_FOUND));
        faq.update(request.getCategory(), request.getQuestion(), request.getAnswer());
        return FaqResponse.from(faq);
    }

    @Transactional
    public void deleteFaq(Long id) {
        Faq faq = faqRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.FAQ_NOT_FOUND));
        faqRepository.delete(faq);
    }

    @Transactional
    public void reorderFaqs(FaqSortRequest request) {
        List<Long> ids = request.getItems().stream().map(FaqSortRequest.Item::getId).toList();
        Map<Long, Faq> faqMap = new HashMap<>();
        for (Faq faq : faqRepository.findAllById(ids)) {
            faqMap.put(faq.getId(), faq);
        }
        for (FaqSortRequest.Item item : request.getItems()) {
            Faq faq = faqMap.get(item.getId());
            if (faq == null) {
                throw new BusinessException(ErrorCode.FAQ_NOT_FOUND);
            }
            faq.updateSortOrder(item.getSortOrder());
        }
    }
}
