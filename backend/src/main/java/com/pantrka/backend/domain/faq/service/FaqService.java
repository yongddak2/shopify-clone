package com.pantrka.backend.domain.faq.service;

import com.pantrka.backend.domain.faq.dto.FaqResponse;
import com.pantrka.backend.domain.faq.repository.FaqRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FaqService {

    private final FaqRepository faqRepository;

    public List<FaqResponse> getFaqs() {
        return faqRepository.findAllByOrderByCategoryAscSortOrderAscIdAsc().stream()
                .map(FaqResponse::from)
                .toList();
    }
}
