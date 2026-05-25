package com.pantrka.backend.domain.qna.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "qna_image")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QnaImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "qna_id", nullable = false)
    private Qna qna;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private int sortOrder;

    @Builder
    public QnaImage(Qna qna, String url, int sortOrder) {
        this.qna = qna;
        this.url = url;
        this.sortOrder = sortOrder;
    }
}
