package com.pantrka.backend.global.common;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 고객센터 카테고리 — FAQ / Q&A 공유.
 */
@Getter
@RequiredArgsConstructor
public enum SupportCategory {
    DELIVERY("배송"),
    EXCHANGE("교환/반품"),
    PAYMENT("결제"),
    MEMBER("회원"),
    PRODUCT("상품"),
    ETC("기타");

    private final String label;
}
