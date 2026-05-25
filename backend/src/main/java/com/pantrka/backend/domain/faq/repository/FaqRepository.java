package com.pantrka.backend.domain.faq.repository;

import com.pantrka.backend.domain.faq.entity.Faq;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FaqRepository extends JpaRepository<Faq, Long> {

    List<Faq> findAllByOrderByCategoryAscSortOrderAscIdAsc();
}
