package com.pantrka.backend.domain.seasoncollection.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "season_collection_image")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SeasonCollectionImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collection_id", nullable = false)
    private SeasonCollection collection;

    @Column(nullable = false, length = 500)
    private String imageUrl;

    @Column(nullable = false)
    private int sortOrder;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @Builder
    public SeasonCollectionImage(String imageUrl, int sortOrder) {
        this.imageUrl = imageUrl;
        this.sortOrder = sortOrder;
    }

    public void assignCollection(SeasonCollection collection) {
        this.collection = collection;
    }

    public void updateSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }
}
