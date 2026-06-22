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

    @Column(name = "instagram_handle", length = 100)
    private String instagramHandle;

    @Column(name = "instagram_image_url_1", length = 1000)
    private String instagramImageUrl1;

    @Column(name = "instagram_link_url_1", length = 500)
    private String instagramLinkUrl1;

    @Column(name = "instagram_image_url_2", length = 1000)
    private String instagramImageUrl2;

    @Column(name = "instagram_link_url_2", length = 500)
    private String instagramLinkUrl2;

    @Column(name = "instagram_image_url_3", length = 1000)
    private String instagramImageUrl3;

    @Column(name = "instagram_link_url_3", length = 500)
    private String instagramLinkUrl3;

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

    public void updateInstagram(
            String handle,
            String imageUrl1,
            String linkUrl1,
            String imageUrl2,
            String linkUrl2,
            String imageUrl3,
            String linkUrl3) {
        this.instagramHandle = handle;
        this.instagramImageUrl1 = imageUrl1;
        this.instagramLinkUrl1 = linkUrl1;
        this.instagramImageUrl2 = imageUrl2;
        this.instagramLinkUrl2 = linkUrl2;
        this.instagramImageUrl3 = imageUrl3;
        this.instagramLinkUrl3 = linkUrl3;
    }
}
