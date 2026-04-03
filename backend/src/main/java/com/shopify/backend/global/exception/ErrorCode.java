package com.shopify.backend.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Member
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "회원을 찾을 수 없습니다."),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    INVALID_PASSWORD(HttpStatus.BAD_REQUEST, "비밀번호가 올바르지 않습니다."),

    // Address
    ADDRESS_NOT_FOUND(HttpStatus.NOT_FOUND, "배송지를 찾을 수 없습니다."),
    ADDRESS_FORBIDDEN(HttpStatus.FORBIDDEN, "해당 배송지에 접근 권한이 없습니다."),

    // Category
    CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "카테고리를 찾을 수 없습니다."),

    // Product
    PRODUCT_NOT_FOUND(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다."),
    PRODUCT_OPTION_NOT_FOUND(HttpStatus.NOT_FOUND, "상품 옵션을 찾을 수 없습니다."),
    OUT_OF_STOCK(HttpStatus.BAD_REQUEST, "재고가 부족합니다."),

    // Cart
    CART_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "장바구니 항목을 찾을 수 없습니다."),
    CART_ITEM_FORBIDDEN(HttpStatus.FORBIDDEN, "해당 장바구니 항목에 접근 권한이 없습니다."),

    // Order
    ORDER_NOT_FOUND(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다."),
    ORDER_FORBIDDEN(HttpStatus.FORBIDDEN, "해당 주문에 접근 권한이 없습니다."),
    ORDER_CANCEL_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "취소할 수 없는 주문 상태입니다."),
    INVALID_ORDER_STATUS(HttpStatus.BAD_REQUEST, "유효하지 않은 주문 상태입니다."),
    INVALID_ORDER_STATUS_TRANSITION(HttpStatus.BAD_REQUEST, "허용되지 않는 주문 상태 전환입니다."),

    // Payment
    PAYMENT_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "결제에 실패했습니다."),
    PAYMENT_AMOUNT_MISMATCH(HttpStatus.BAD_REQUEST, "결제 금액이 주문 금액과 일치하지 않습니다."),
    ORDER_NOT_PENDING(HttpStatus.BAD_REQUEST, "결제 대기 상태가 아닌 주문입니다."),
    PAYMENT_ALREADY_PROCESSED(HttpStatus.BAD_REQUEST, "이미 처리된 결제입니다."),
    TOSS_API_FAILED(HttpStatus.BAD_GATEWAY, "토스페이먼츠 API 호출에 실패했습니다."),

    // Coupon
    COUPON_NOT_FOUND(HttpStatus.NOT_FOUND, "쿠폰을 찾을 수 없습니다."),
    COUPON_EXPIRED(HttpStatus.BAD_REQUEST, "만료된 쿠폰입니다."),
    COUPON_ALREADY_ISSUED(HttpStatus.BAD_REQUEST, "이미 발급받은 쿠폰입니다."),
    COUPON_OUT_OF_STOCK(HttpStatus.BAD_REQUEST, "쿠폰 수량이 소진되었습니다."),
    COUPON_NOT_USABLE(HttpStatus.BAD_REQUEST, "사용할 수 없는 쿠폰입니다."),
    COUPON_MIN_ORDER_NOT_MET(HttpStatus.BAD_REQUEST, "최소 주문 금액을 충족하지 않습니다."),
    MEMBER_COUPON_NOT_FOUND(HttpStatus.NOT_FOUND, "보유한 쿠폰을 찾을 수 없습니다."),

    // Review
    REVIEW_NOT_FOUND(HttpStatus.NOT_FOUND, "리뷰를 찾을 수 없습니다."),
    REVIEW_ALREADY_EXISTS(HttpStatus.BAD_REQUEST, "이미 해당 주문 상품에 리뷰를 작성했습니다."),
    REVIEW_NOT_OWNER(HttpStatus.FORBIDDEN, "본인의 리뷰만 삭제할 수 있습니다."),
    ORDER_ITEM_NOT_DELIVERED(HttpStatus.BAD_REQUEST, "배송 완료된 상품만 리뷰를 작성할 수 있습니다."),

    // Wishlist
    WISHLIST_NOT_FOUND(HttpStatus.NOT_FOUND, "찜 목록에서 찾을 수 없습니다."),

    // File
    INVALID_FILE_TYPE(HttpStatus.BAD_REQUEST, "허용되지 않는 파일 형식입니다."),
    FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "파일 업로드에 실패했습니다."),
    FILE_SIZE_EXCEEDED(HttpStatus.BAD_REQUEST, "파일 크기는 5MB 이하여야 합니다."),

    // Auth
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),

    // Common
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "잘못된 입력값입니다.");

    private final HttpStatus httpStatus;
    private final String message;
}
