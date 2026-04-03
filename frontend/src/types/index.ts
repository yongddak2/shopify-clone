// 백엔드 공통 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
}

// 인증
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: string;
}

// 상품
export interface ProductImage {
  id: number;
  url: string;
  sortOrder: number;
  isThumbnail: boolean;
}

export interface Product {
  id: number;
  name: string;
  basePrice: number;
  discountRate: number;
  status: string;
  thumbnailUrl: string | null;
  images: ProductImage[];
}

// 카테고리
export interface Category {
  id: number;
  name: string;
  depth: number;
  sortOrder: number;
  children: Category[];
}

// 상품 상세 (옵션 포함)
export interface ProductOptionGroup {
  id: number;
  name: string;
  values: ProductOptionValue[];
}

export interface ProductOptionValue {
  id: number;
  value: string;
  additionalPrice: number;
  stockQuantity: number;
}

export interface ProductDetail {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  discountRate: number;
  status: string;
  viewCount: number;
  categoryId: number;
  images: ProductImage[];
  optionGroups: ProductOptionGroup[];
}

// 장바구니
export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  optionValueId: number;
  optionValue: string;
  basePrice: number;
  additionalPrice: number;
  discountRate: number;
  quantity: number;
  thumbnailUrl: string | null;
}

// 주문
export interface OrderRequest {
  cartItemIds: number[];
  recipient: string;
  phone: string;
  address: string;
  memo: string;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  totalAmount: number;
  discountAmount: number;
  deliveryFee: number;
  finalAmount: number;
  status: string;
  recipient: string;
  phone: string;
  address: string;
  memo: string;
  createdAt: string;
  orderItems: OrderItemResponse[];
}

export interface OrderItemResponse {
  id: number;
  productNameSnapshot: string;
  optionInfoSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  subtotal: number;
}

// 배송지
export interface MemberAddress {
  id: number;
  label: string;
  recipient: string;
  phone: string;
  zipcode: string;
  address: string;
  addressDetail: string;
  defaultAddress: boolean;
}

// 페이지네이션 (Spring Page 응답)
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// 관리자 - 상품
export interface AdminProduct {
  id: number;
  name: string;
  basePrice: number;
  discountRate: number;
  status: string;
  categoryId: number;
  description: string;
  viewCount: number;
  createdAt: string;
  deletedAt: string | null;
  images: ProductImage[];
  optionGroups: ProductOptionGroup[];
}

export interface CreateProductRequest {
  name: string;
  basePrice: number;
  discountRate: number;
  categoryId: number;
  description: string;
  status: string;
  images?: { url: string; sortOrder: number; isThumbnail: boolean }[];
  optionGroups: {
    name: string;
    optionValues: { value: string; additionalPrice: number; stockQuantity: number }[];
  }[];
}

// 관리자 - 주문
export interface AdminOrder {
  id: number;
  orderNumber: string;
  memberId: number;
  recipient: string;
  phone: string;
  address: string;
  memo: string;
  totalAmount: number;
  discountAmount: number;
  deliveryFee: number;
  finalAmount: number;
  status: string;
  createdAt: string;
  items: AdminOrderItem[];
}

export interface AdminOrderItem {
  id: number;
  productId: number;
  productNameSnapshot: string;
  optionInfoSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  subtotal: number;
}

// 관리자 - 회원
export interface AdminUser {
  id: number;
  email: string;
  name: string;
  phone: string;
  provider: string;
  role: string;
  createdAt: string;
  deletedAt: string | null;
}

// 관리자 - 쿠폰
export interface AdminCoupon {
  id: number;
  name: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  totalQuantity: number;
  issuedQuantity: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface CreateCouponRequest {
  name: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  totalQuantity: number;
  startDate: string;
  endDate: string;
}
