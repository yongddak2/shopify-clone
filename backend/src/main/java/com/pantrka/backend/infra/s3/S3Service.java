package com.pantrka.backend.infra.s3;

import com.pantrka.backend.global.exception.BusinessException;
import com.pantrka.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.core.ResponseBytes;

import java.io.IOException;
import java.net.URI;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3Service {

    private final S3Client s3Client;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    @Value("${cloud.aws.s3.region}")
    private String region;

    @Value("${cloud.aws.s3.public-base-url}")
    private String publicBaseUrl;

    public String uploadFile(MultipartFile file) {
        return uploadFile(file, "products");
    }

    public String uploadFile(MultipartFile file, String directory) {
        String originalFilename = file.getOriginalFilename();
        String extension = extractExtension(originalFilename);
        String key = directory + "/" + UUID.randomUUID() + "." + extension;

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putObjectRequest,
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (IOException | S3Exception e) {
            throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED);
        }

        return publicBaseUrl + "/api/images/" + key;
    }

    public void deleteFile(String imageUrl) {
        S3ObjectLocation location = extractLocation(imageUrl);

        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(location.bucket())
                .key(location.key())
                .build();

        s3Client.deleteObject(deleteObjectRequest);
    }

    public StoredImage getFile(String key) {
        try {
            ResponseBytes<GetObjectResponse> object = s3Client.getObjectAsBytes(
                    GetObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .build());
            return new StoredImage(
                    object.asByteArray(),
                    object.response().contentType(),
                    object.response().contentLength());
        } catch (S3Exception e) {
            throw new BusinessException(ErrorCode.IMAGE_NOT_FOUND);
        }
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE);
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    private S3ObjectLocation extractLocation(String imageUrl) {
        try {
            URI uri = URI.create(imageUrl);
            String publicPrefix = "/api/images/";
            if (uri.getPath() != null && uri.getPath().startsWith(publicPrefix)) {
                String key = uri.getPath().substring(publicPrefix.length());
                if (key.isBlank()) throw new IllegalArgumentException("Invalid image URL");
                return new S3ObjectLocation(bucket, key);
            }
            String host = uri.getHost();
            String suffix = ".s3." + region + ".amazonaws.com";
            if (host == null || !host.endsWith(suffix)) {
                throw new IllegalArgumentException("Unsupported S3 URL");
            }
            String sourceBucket = host.substring(0, host.length() - suffix.length());
            String key = uri.getPath().replaceFirst("^/", "");
            if (sourceBucket.isBlank() || key.isBlank()) {
                throw new IllegalArgumentException("Invalid S3 URL");
            }
            return new S3ObjectLocation(sourceBucket, key);
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "올바른 S3 이미지 URL이 아닙니다.");
        }
    }

    private record S3ObjectLocation(String bucket, String key) {
    }

    public record StoredImage(byte[] bytes, String contentType, long contentLength) {
    }
}
