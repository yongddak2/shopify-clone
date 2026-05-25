package com.pantrka.backend.domain.qna.entity;

import com.pantrka.backend.domain.auth.entity.Member;
import com.pantrka.backend.global.common.SupportCategory;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "qna")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Qna {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SupportCategory category;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private boolean isSecret = false;

    @Column(columnDefinition = "TEXT")
    private String answer;

    private LocalDateTime answeredAt;

    @OneToMany(mappedBy = "qna", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QnaImage> images = new ArrayList<>();

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;

    @Builder
    public Qna(Member member, SupportCategory category, String title, String content, boolean isSecret) {
        this.member = member;
        this.category = category;
        this.title = title;
        this.content = content;
        this.isSecret = isSecret;
    }

    public void addImage(QnaImage image) {
        this.images.add(image);
    }

    public void update(SupportCategory category, String title, String content, boolean isSecret) {
        this.category = category;
        this.title = title;
        this.content = content;
        this.isSecret = isSecret;
    }

    public void writeAnswer(String answer) {
        this.answer = answer;
        this.answeredAt = LocalDateTime.now();
    }

    public void clearAnswer() {
        this.answer = null;
        this.answeredAt = null;
    }

    public void markDeleted() {
        this.deletedAt = LocalDateTime.now();
    }

    public boolean isAnswered() {
        return this.answer != null;
    }

    public boolean isOwner(Long memberId) {
        return this.member != null && this.member.getId().equals(memberId);
    }
}
