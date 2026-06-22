package com.pantrka.backend.domain.admin.service;

import com.pantrka.backend.domain.admin.dto.InstagramItemRequest;
import com.pantrka.backend.domain.admin.dto.InstagramSectionUpdateRequest;
import com.pantrka.backend.domain.admin.dto.MainPageConfigResponse;
import com.pantrka.backend.domain.admin.entity.MainPageConfig;
import com.pantrka.backend.domain.admin.repository.MainPageConfigRepository;
import com.pantrka.backend.global.exception.BusinessException;
import com.pantrka.backend.infra.s3.S3Service;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class MainPageConfigServiceTest {

    @Mock
    private MainPageConfigRepository repository;

    @Mock
    private S3Service s3Service;

    @InjectMocks
    private MainPageConfigService service;

    @Test
    void savesThreeInstagramItems() {
        MainPageConfig config = MainPageConfig.empty();
        given(repository.findById(MainPageConfig.SINGLETON_ID)).willReturn(Optional.of(config));

        MainPageConfigResponse response = service.updateInstagram(request(
                "@pantrka",
                item("https://cdn.example.com/1.jpg", "https://www.instagram.com/p/one/"),
                item("https://cdn.example.com/2.jpg", "https://instagram.com/p/two/"),
                item("https://cdn.example.com/3.jpg", "https://www.instagram.com/p/three/")));

        assertEquals("pantrka", response.getInstagramHandle());
        assertEquals(3, response.getInstagramItems().size());
        assertEquals("https://cdn.example.com/2.jpg", response.getInstagramItems().get(1).getImageUrl());
    }

    @Test
    void rejectsPartialInstagramSection() {
        given(repository.findById(MainPageConfig.SINGLETON_ID))
                .willReturn(Optional.of(MainPageConfig.empty()));

        InstagramSectionUpdateRequest request = request(
                "pantrka",
                item("https://cdn.example.com/1.jpg", "https://www.instagram.com/p/one/"),
                item(null, null),
                item(null, null));

        assertThrows(BusinessException.class, () -> service.updateInstagram(request));
    }

    @Test
    void rejectsNonInstagramLink() {
        given(repository.findById(MainPageConfig.SINGLETON_ID))
                .willReturn(Optional.of(MainPageConfig.empty()));

        InstagramSectionUpdateRequest request = request(
                "pantrka",
                item("https://cdn.example.com/1.jpg", "https://example.com/one"),
                item("https://cdn.example.com/2.jpg", "https://www.instagram.com/p/two/"),
                item("https://cdn.example.com/3.jpg", "https://www.instagram.com/p/three/"));

        assertThrows(BusinessException.class, () -> service.updateInstagram(request));
    }

    private InstagramSectionUpdateRequest request(
            String handle,
            InstagramItemRequest first,
            InstagramItemRequest second,
            InstagramItemRequest third) {
        InstagramSectionUpdateRequest request = new InstagramSectionUpdateRequest();
        ReflectionTestUtils.setField(request, "handle", handle);
        ReflectionTestUtils.setField(request, "items", List.of(first, second, third));
        return request;
    }

    private InstagramItemRequest item(String imageUrl, String linkUrl) {
        InstagramItemRequest item = new InstagramItemRequest();
        ReflectionTestUtils.setField(item, "imageUrl", imageUrl);
        ReflectionTestUtils.setField(item, "linkUrl", linkUrl);
        return item;
    }
}
