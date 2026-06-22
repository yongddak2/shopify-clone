package com.pantrka.backend.global.exception;

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
    CANNOT_MODIFY_SELF(HttpStatus.BAD_REQUEST, "본인 계정은 변경할 수 없습니다."),
    MEMBER_ALREADY_WITHDRAWN(HttpStatus.BAD_REQUEST, "이미 탈퇴 처리된 회원입니다."),

    // Address
    ADDRESS_NOT_FOUND(HttpStatus.NOT_FOUND, "배송지를 찾을 수 없습니다."),
    ADDRESS_FORBIDDEN(HttpStatus.FORBIDDEN, "해당 배송지에 접근 권한이 없습니다."),

    // Category
    CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "카테고리를 찾을 수 없습니다."),

    // Product
    PRODUCT_NOT_FOUND(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다."),
    PRODUCT_OPTION_NOT_FOUND(HttpStatus.NOT_FOUND, "상품 옵션을 찾을 수 없습니다."),
    OUT_OF_STOCK(HttpStatus.BAD_REQUEST, "재고가 부족합니다."),
    INVALID_STOCK_QUANTITY(HttpStatus.BAD_REQUEST, "재고 수량은 0 이상이어야 합니다."),

    // Cart
    CART_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "장바구니 항목을 찾을 수 없습니다."),
    CART_ITEM_FORBIDDEN(HttpStatus.FORBIDDEN, "해당 장바구니 항목에 접근 권한이 없습니다."),

    // Order
    ORDER_NOT_FOUND(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다."),
    ORDER_FORBIDDEN(HttpStatus.FORBIDDEN, "해당 주문에 접근 권한이 없습니다."),
    ORDER_CANCEL_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "취소할 수 없는 주문 상태입니다."),
    INVALID_ORDER_STATUS(HttpStatus.BAD_REQUEST, "유효하지 않은 주문 상태입니다."),
    INVALID_ORDER_STATUS_TRANSITION(HttpStatus.BAD_REQUEST, "허용되지 않는 주문 상태 전환입니다."),
    ORDER_NOT_DELIVERED(HttpStatus.BAD_REQUEST, "배송 완료 상태에서만 구매 확정이 가능합니다."),
    ORDER_ALREADY_CONFIRMED(HttpStatus.BAD_REQUEST, "이미 구매 확정된 주문입니다."),
    MISSING_TRACKING_INFO(HttpStatus.BAD_REQUEST, "배송사와 운송장 번호는 필수입니다."),
    SHIPPING_UPDATE_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "배송중 또는 배송완료 주문만 운송장 정보를 수정할 수 있습니다."),

    // Payment
    PAYMENT_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "결제에 실패했습니다."),
    PAYMENT_AMOUNT_MISMATCH(HttpStatus.BAD_REQUEST, "결제 금액이 주문 금액과 일치하지 않습니다."),
    ORDER_NOT_PENDING(HttpStatus.BAD_REQUEST, "결제 대기 상태가 아닌 주문입니다."),
    PAYMENT_ALREADY_PROCESSED(HttpStatus.BAD_REQUEST, "이미 처리된 결제입니다."),
    NICEPAY_API_FAILED(HttpStatus.BAD_GATEWAY, "NICE Payments API 호출에 실패했습니다."),
    NICEPAY_NOT_CONFIGURED(HttpStatus.SERVICE_UNAVAILABLE, "NICE Payments 결제 설정이 필요합니다."),
    NICEPAY_AUTH_FAILED(HttpStatus.BAD_REQUEST, "NICE Payments 인증 결과가 올바르지 않습니다."),
    NICEPAY_SIGNATURE_INVALID(HttpStatus.BAD_REQUEST, "NICE Payments 결제 정보 검증에 실패했습니다."),
    PAYMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "결제 정보를 찾을 수 없습니다."),
    PAYMENT_NOT_COMPLETED(HttpStatus.BAD_REQUEST, "완료된 결제만 취소할 수 있습니다."),

    // Coupon
    COUPON_NOT_FOUND(HttpStatus.NOT_FOUND, "쿠폰을 찾을 수 없습니다."),
    COUPON_EXPIRED(HttpStatus.BAD_REQUEST, "만료된 쿠폰입니다."),
    COUPON_ALREADY_ISSUED(HttpStatus.BAD_REQUEST, "이미 발급받은 쿠폰입니다."),
    COUPON_OUT_OF_STOCK(HttpStatus.BAD_REQUEST, "쿠폰 수량이 소진되었습니다."),
    COUPON_NOT_USABLE(HttpStatus.BAD_REQUEST, "사용할 수 없는 쿠폰입니다."),
    COUPON_MIN_ORDER_NOT_MET(HttpStatus.BAD_REQUEST, "최소 주문 금액을 충족하지 않습니다."),
    COUPON_ALREADY_USED(HttpStatus.BAD_REQUEST, "이미 사용된 쿠폰입니다."),
    COUPON_NOT_OWNED(HttpStatus.FORBIDDEN, "본인의 쿠폰이 아닙니다."),
    MEMBER_COUPON_NOT_FOUND(HttpStatus.NOT_FOUND, "보유한 쿠폰을 찾을 수 없습니다."),
    COUPON_HAS_ISSUED_MEMBERS(HttpStatus.BAD_REQUEST, "이미 발급된 쿠폰은 삭제할 수 없습니다."),
    COUPON_TOTAL_QUANTITY_INVALID(HttpStatus.BAD_REQUEST, "총 수량은 이미 발급된 수량보다 적을 수 없습니다."),
    WELCOME_VALID_DAYS_REQUIRED(HttpStatus.BAD_REQUEST, "웰컴 쿠폰은 회원별 유효 기간(일)을 1 이상으로 지정해야 합니다."),
    WELCOME_COUPON_NOT_DOWNLOADABLE(HttpStatus.BAD_REQUEST, "웰컴 쿠폰은 회원가입 시 자동 발급됩니다."),

    // Review
    REVIEW_NOT_FOUND(HttpStatus.NOT_FOUND, "리뷰를 찾을 수 없습니다."),
    REVIEW_ALREADY_EXISTS(HttpStatus.BAD_REQUEST, "이미 해당 주문 상품에 리뷰를 작성했습니다."),
    REVIEW_NOT_OWNER(HttpStatus.FORBIDDEN, "본인의 리뷰만 삭제할 수 있습니다."),
    REVIEW_IMAGE_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "리뷰 이미지는 최대 10장까지 가능합니다."),
    ORDER_ITEM_NOT_DELIVERED(HttpStatus.BAD_REQUEST, "배송 완료된 상품만 리뷰를 작성할 수 있습니다."),

    // Wishlist
    WISHLIST_NOT_FOUND(HttpStatus.NOT_FOUND, "찜 목록에서 찾을 수 없습니다."),

    // Banner
    BANNER_NOT_FOUND(HttpStatus.NOT_FOUND, "배너를 찾을 수 없습니다."),
    BANNER_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "배너는 최대 5개까지 등록 가능합니다."),
    BANNER_LINK_CONFLICT(HttpStatus.BAD_REQUEST, "연결 상품과 URL 중 하나만 지정할 수 있습니다."),
    BANNER_LINK_URL_INVALID(HttpStatus.BAD_REQUEST, "링크 URL은 / 또는 http(s)://로 시작해야 합니다."),

    // Main Page New Arrival
    NEW_ARRIVAL_NOT_FOUND(HttpStatus.NOT_FOUND, "등록된 상품을 찾을 수 없습니다."),
    NEW_ARRIVAL_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "NEW ARRIVALS는 최대 10개까지 등록 가능합니다."),
    NEW_ARRIVAL_ALREADY_REGISTERED(HttpStatus.BAD_REQUEST, "이미 등록된 상품입니다."),

    // File
    INVALID_FILE_TYPE(HttpStatus.BAD_REQUEST, "허용되지 않는 파일 형식입니다."),
    FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "파일 업로드에 실패했습니다."),
    FILE_SIZE_EXCEEDED(HttpStatus.BAD_REQUEST, "파일 크기 제한을 초과했습니다."),
    IMAGE_NOT_FOUND(HttpStatus.NOT_FOUND, "이미지를 찾을 수 없습니다."),

    // Return/Exchange
    RETURN_REQUEST_NOT_FOUND(HttpStatus.NOT_FOUND, "반품/교환 요청을 찾을 수 없습니다."),
    DUPLICATE_RETURN_REQUEST(HttpStatus.BAD_REQUEST, "이미 동일한 요청이 진행 중입니다."),
    CONFIRMED_ORDER_CANNOT_REQUEST(HttpStatus.BAD_REQUEST, "구매 확정된 주문은 반품/교환을 신청할 수 없습니다."),
    INVALID_REQUEST_STATUS(HttpStatus.BAD_REQUEST, "현재 상태에서는 처리할 수 없습니다."),
    EXCHANGE_OPTION_REQUIRED(HttpStatus.BAD_REQUEST, "교환 신청 시 원하는 옵션을 선택해야 합니다."),
    TOO_MANY_IMAGES(HttpStatus.BAD_REQUEST, "이미지는 최대 3장까지 첨부 가능합니다."),

    // Password
    PASSWORD_MISMATCH(HttpStatus.BAD_REQUEST, "현재 비밀번호가 일치하지 않습니다."),
    PASSWORD_CONFIRM_MISMATCH(HttpStatus.BAD_REQUEST, "새 비밀번호가 일치하지 않습니다."),
    PASSWORD_SAME_AS_CURRENT(HttpStatus.BAD_REQUEST, "현재 비밀번호와 동일합니다."),
    PASSWORD_INVALID_FORMAT(HttpStatus.BAD_REQUEST, "비밀번호는 8자 이상, 영문+숫자+특수문자를 포함해야 합니다."),
    SOCIAL_LOGIN_PASSWORD_CHANGE(HttpStatus.BAD_REQUEST, "소셜 로그인 사용자는 비밀번호를 변경할 수 없습니다."),
    PASSWORD_CHANGE_TOO_FREQUENT(HttpStatus.BAD_REQUEST, "비밀번호는 30일에 한 번만 변경할 수 있습니다."),

    // Auth
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),

    // OAuth (소셜 로그인)
    OAUTH_PROVIDER_NOT_SUPPORTED(HttpStatus.BAD_REQUEST, "지원하지 않는 소셜 로그인 제공자입니다."),
    OAUTH_NOT_CONFIGURED(HttpStatus.INTERNAL_SERVER_ERROR, "소셜 로그인 설정이 완료되지 않았습니다."),
    OAUTH_TOKEN_FAILED(HttpStatus.BAD_GATEWAY, "소셜 로그인 인증에 실패했습니다."),
    OAUTH_USER_INFO_FAILED(HttpStatus.BAD_GATEWAY, "소셜 계정 정보를 가져오지 못했습니다."),
    OAUTH_EMAIL_REQUIRED(HttpStatus.BAD_REQUEST, "소셜 계정의 이메일 제공에 동의해야 로그인할 수 있습니다."),

    // Password Reset
    EMAIL_NOT_FOUND(HttpStatus.NOT_FOUND, "가입되지 않은 이메일입니다."),
    INVALID_RESET_CODE(HttpStatus.BAD_REQUEST, "인증번호가 일치하지 않거나 만료되었습니다."),
    RESET_NOT_VERIFIED(HttpStatus.BAD_REQUEST, "이메일 인증이 완료되지 않았습니다."),
    SOCIAL_LOGIN_CANNOT_RESET_PASSWORD(HttpStatus.BAD_REQUEST, "소셜 로그인 사용자는 비밀번호를 재설정할 수 없습니다."),
    EMAIL_SEND_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "이메일 발송에 실패했습니다."),
    RESET_CODE_COOLTIME(HttpStatus.TOO_MANY_REQUESTS, "잠시 후 다시 시도해주세요."),

    // Notice
    NOTICE_NOT_FOUND(HttpStatus.NOT_FOUND, "공지사항을 찾을 수 없습니다."),

    // FAQ
    FAQ_NOT_FOUND(HttpStatus.NOT_FOUND, "FAQ를 찾을 수 없습니다."),

    // Q&A
    QNA_NOT_FOUND(HttpStatus.NOT_FOUND, "문의를 찾을 수 없습니다."),
    QNA_FORBIDDEN(HttpStatus.FORBIDDEN, "해당 문의에 접근 권한이 없습니다."),
    QNA_ANSWERED_CANNOT_MODIFY(HttpStatus.BAD_REQUEST, "이미 답변된 문의는 수정할 수 없습니다."),
    QNA_IMAGE_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "문의 이미지는 최대 3장까지 첨부 가능합니다."),

    // Answer Template
    ANSWER_TEMPLATE_NOT_FOUND(HttpStatus.NOT_FOUND, "답변 템플릿을 찾을 수 없습니다."),

    // Season Collection
    SEASON_NOT_FOUND(HttpStatus.NOT_FOUND, "시즌 컬렉션을 찾을 수 없습니다."),
    SEASON_NAME_DUPLICATED(HttpStatus.CONFLICT, "이미 사용 중인 시즌 이름입니다."),
    SEASON_NAME_INVALID(HttpStatus.BAD_REQUEST, "시즌 이름은 영문, 숫자, 공백만 사용할 수 있습니다."),
    SEASON_IMAGE_NOT_FOUND(HttpStatus.NOT_FOUND, "시즌 사진을 찾을 수 없습니다."),

    // Common
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "잘못된 입력값입니다.");

    private final HttpStatus httpStatus;
    private final String message;
}
