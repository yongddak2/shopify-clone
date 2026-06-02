package com.pantrka.backend.domain.admin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "main_page_config")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MainPageConfig {

    public static final Long SINGLETON_ID = 1L;

    @Id
    private Long id = SINGLETON_ID;

    @Column(length = 500)
    private String subText;

    @Column(name = "about_image_url")
    private String aboutImageUrl;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public static MainPageConfig empty() {
        MainPageConfig c = new MainPageConfig();
        c.id = SINGLETON_ID;
        return c;
    }

    public void updateSubText(String subText) {
        this.subText = subText;
    }

    public void updateAboutImageUrl(String aboutImageUrl) {
        this.aboutImageUrl = aboutImageUrl;
    }
}
