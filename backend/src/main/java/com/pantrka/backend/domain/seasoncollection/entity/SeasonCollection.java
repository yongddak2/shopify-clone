package com.pantrka.backend.domain.seasoncollection.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "season_collection",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_season_collection_name", columnNames = "name"),
                @UniqueConstraint(name = "uk_season_collection_slug", columnNames = "slug")
        })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SeasonCollection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 60)
    private String slug;

    @Column(nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean isActive = true;

    @OneToMany(mappedBy = "collection", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<SeasonCollectionImage> images = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;

    @Builder
    public SeasonCollection(String name, String slug, int sortOrder) {
        this.name = name;
        this.slug = slug;
        this.sortOrder = sortOrder;
        this.isActive = true;
    }

    public void updateName(String name, String slug) {
        this.name = name;
        this.slug = slug;
    }

    public void updateSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public void toggleActive() {
        this.isActive = !this.isActive;
    }

    public void markDeleted() {
        this.deletedAt = LocalDateTime.now();
    }

    public void addImage(SeasonCollectionImage image) {
        this.images.add(image);
        image.assignCollection(this);
    }
}
