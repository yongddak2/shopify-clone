# backend/CLAUDE.md

백엔드 전용 컨텍스트. 루트 CLAUDE.md와 함께 로드됨.

---

## 패키지 구조

```
src/main/java/com/shopify/backend/
├── global/
│   ├── config/       ← SecurityConfig, JwtProvider, TossPaymentsConfig
│   ├── filter/       ← JwtAuthenticationFilter
│   ├── exception/    ← ErrorCode, BusinessException, GlobalExceptionHandler
│   └── common/       ← ApiResponse
├── domain/
│   ├── auth/         ← controller, service, repository, entity, dto
│   ├── product/      ← controller, service, repository, entity, dto
│   ├── order/        ← controller, service, repository, entity, dto
│   │                    (PaymentService, ReturnExchangeService 포함)
│   ├── admin/        ← controller, service
│   │                    (상품/주문/회원/쿠폰/배너/재고/반품교환 관리)
│   ├── review/       ← controller, service, repository, entity, dto
│   ├── wishlist/     ← controller, service, repository, entity, dto
│   └── coupon/       ← controller, service, repository, entity, dto
└── infra/
    ├── s3/           ← S3Config, S3Service (uploadFile/deleteFile)
    ├── email/        ← EmailService (Gmail SMTP, @Async)
    └── redis/
```

---

## DB 스키마

```
MEMBER: id, email(UK), password, name, phone, role(USER/ADMIN),
        provider(LOCAL/KAKAO/GOOGLE), provider_id, password_changed_at,
        created_at, updated_at, deleted_at

MEMBER_ADDRESS: id, member_id(FK), label, recipient, phone,
                zipcode, address, address_detail, is_default

CATEGORY: id, parent_id(FK 자기참조), name, depth, sort_order

PRODUCT: id, category_id(FK), name, description, base_price,
         discount_rate, sales_count, status(ACTIVE/SOLDOUT/INACTIVE),
         view_count, created_at, updated_at, deleted_at

PRODUCT_IMAGE: id, product_id(FK), url, sort_order, is_thumbnail

PRODUCT_OPTION_GROUP: id, product_id(FK), name → 항상 "옵션"

PRODUCT_OPTION_VALUE: id, option_group_id(FK),
                      value → "S-블랙" 형태 조합값,
                      additional_price, stock_quantity

CART_ITEM: id, member_id(FK), product_id(FK), option_value_id(FK),
           quantity, created_at

ORDERS: id, member_id(FK), member_coupon_id(FK nullable),
        order_number(UK), total_amount, discount_amount,
        delivery_fee, final_amount, status, confirmed_at(nullable),
        recipient, phone, address, memo, created_at, updated_at

ORDER_ITEM: id, order_id(FK), product_id(FK), option_value_id(FK),
            product_name_snapshot, option_info_snapshot,
            price_snapshot, quantity, subtotal

PAYMENT: id, order_id(FK), payment_key(UK),
         method(CARD/TRANSFER/VIRTUAL),
         amount, status(READY/DONE/CANCELLED/FAILED),
         paid_at, cancelled_at, created_at

REVIEW: id, member_id(FK), product_id(FK), order_item_id(FK),
        rating, content, created_at, updated_at, deleted_at

REVIEW_IMAGE: id, review_id(FK), url, sort_order

REVIEW_LIKE: id, review_id(FK), member_id, created_at
             (review_id + member_id UNIQUE)

WISHLIST: id, member_id(FK), product_id(FK), created_at

COUPON: id, name, discount_type(FIXED/PERCENT), discount_value,
        min_order_amount, max_discount_amount,
        total_quantity, issued_quantity, start_date, end_date

MEMBER_COUPON: id, member_id(FK), coupon_id(FK),
               used_at, expired_at, created_at

BANNER: id, image_url, sort_order, is_active, link_url(nullable),
        created_at, updated_at

RETURN_EXCHANGE_REQUEST: id, order_item_id(FK), member_id(FK),
                         type(RETURN/EXCHANGE), reason, detail,
                         desired_option_value_id(FK nullable),
                         status(PENDING/APPROVED/REJECTED/COMPLETED),
                         image_urls, created_at, updated_at
```

---

## 인프라 설정값

```
PostgreSQL: localhost:5432 / DB=shopdb / user=shop / pw=shop1234
Redis: localhost:6379 / pw=redis1234
S3: 버킷=yong-byeong-shop-images / 리전=ap-southeast-2
Gmail: happywe2931@gmail.com
JPA: ddl-auto=update, open-in-view=false
Multipart: max-file-size=20MB, max-request-size=20MB
JWT: access 30분 / refresh 7일
TossPayments: confirm-url = https://api.tosspayments.com/v1/payments/confirm
```

---

## 테스트 (21개)

- AuthServiceTest (5): 회원가입/로그인 성공·실패
- OrderServiceTest (9): 주문 생성/취소/배송비/구매확정
- PaymentServiceTest (7): 결제 승인/실패 시나리오
