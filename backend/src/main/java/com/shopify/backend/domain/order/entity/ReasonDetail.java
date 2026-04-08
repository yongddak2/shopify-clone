package com.shopify.backend.domain.order.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ReasonDetail {

    DISLIKE(ReasonCategory.CHANGE_OF_MIND, "상품이 마음에 들지 않음"),
    WRONG_SIZE(ReasonCategory.CHANGE_OF_MIND, "사이즈가 맞지 않음"),
    WRONG_ORDER(ReasonCategory.CHANGE_OF_MIND, "주문을 잘못함"),
    FOUND_CHEAPER(ReasonCategory.CHANGE_OF_MIND, "더 저렴한 상품을 발견함"),

    WRONG_ITEM_SENT(ReasonCategory.SELLER_FAULT, "다른 상품이 배송됨"),
    WRONG_OPTION_SENT(ReasonCategory.SELLER_FAULT, "주문한 옵션과 다른 상품"),
    PRODUCT_DEFECT(ReasonCategory.SELLER_FAULT, "상품 불량/하자"),
    DIFFERENT_FROM_DESC(ReasonCategory.SELLER_FAULT, "상품 설명과 다름"),
    SEWING_DEFECT(ReasonCategory.SELLER_FAULT, "봉제/재봉 불량");

    private final ReasonCategory category;
    private final String label;
}
