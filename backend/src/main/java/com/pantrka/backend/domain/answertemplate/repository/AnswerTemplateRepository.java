package com.pantrka.backend.domain.answertemplate.repository;

import com.pantrka.backend.domain.answertemplate.entity.AnswerTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnswerTemplateRepository extends JpaRepository<AnswerTemplate, Long> {

    List<AnswerTemplate> findAllByOrderBySortOrderAscIdAsc();
}
