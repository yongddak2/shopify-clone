package com.pantrka.backend.infra.s3;

import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class PublicImageController {

    private final S3Service s3Service;

    @GetMapping("/{*key}")
    public ResponseEntity<byte[]> getImage(@PathVariable String key) {
        String normalizedKey = key.replaceFirst("^/", "");
        S3Service.StoredImage image = s3Service.getFile(normalizedKey);
        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(image.contentType());
        } catch (Exception ignored) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }
        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(image.contentLength())
                .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
                .body(image.bytes());
    }
}
