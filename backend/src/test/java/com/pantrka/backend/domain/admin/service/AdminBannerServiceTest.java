package com.pantrka.backend.domain.admin.service;

import com.pantrka.backend.domain.admin.entity.Banner;
import com.pantrka.backend.domain.admin.repository.BannerRepository;
import com.pantrka.backend.domain.product.repository.ProductRepository;
import com.pantrka.backend.infra.s3.S3Service;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AdminBannerServiceTest {

    @Mock
    private BannerRepository bannerRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private S3Service s3Service;

    @InjectMocks
    private AdminBannerService adminBannerService;

    @Test
    void deletesBannerEvenWhenImageDeletionFails() {
        Banner banner = Banner.builder()
                .imageUrl("https://example.com/banner.jpg")
                .sortOrder(1)
                .title("Banner")
                .build();
        given(bannerRepository.findById(1L)).willReturn(Optional.of(banner));
        willThrow(new IllegalArgumentException("invalid S3 URL"))
                .given(s3Service).deleteFile(banner.getImageUrl());

        adminBannerService.deleteBanner(1L);

        verify(bannerRepository).delete(banner);
        verify(s3Service).deleteFile(banner.getImageUrl());
    }
}
