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
  passwordChangedAt: string | null;
}

// 상품
export interface ProductImage {
  id: number;
  url: string;
  sortOrder: number;
  isThumbnail: boolean;
  detail: boolean;
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
  productInfo: string;
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
  stockQuantity: number;
  thumbnailUrl: string | null;
}

// 주문
export interface OrderRequest {
  cartItemIds: number[];
  recipient: string;
  phone: string;
  address: string;
  memo: string;
  memberCouponId: number | null;
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
  carrier: string | null;
  trackingNumber: string | null;
  createdAt: string;
  confirmedAt: string | null;
  couponName: string | null;
  couponDiscountAmount: number | null;
  orderItems: OrderItemResponse[];
  returnRequested: boolean;
  exchangeRequested: boolean;
}

export interface OrderItemResponse {
  id: number;
  productId: number;
  productNameSnapshot: string;
  optionInfoSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  subtotal: number;
  thumbnailUrl: string | null;
}

// 찜 목록
export interface WishlistItem {
  id: number;
  productId: number;
  productName: string;
  productPrice: number;
  thumbnailUrl: string | null;
  createdAt: string;
}

// 다운로드 가능한 쿠폰 (공개 쿠폰 목록)
export interface CouponListItem {
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
  isIssued: boolean;
}

// 내 쿠폰
export interface MemberCoupon {
  id: number;
  couponId: number;
  couponName: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  usedAt: string | null;
  expiredAt: string;
  createdAt: string;
  usable: boolean;
}

// 리뷰
export interface Review {
  id: number;
  orderItemId?: number;
  memberName: string;
  rating: number;
  content: string;
  optionInfo: string | null;
  images: string[];
  likeCount: number;
  liked: boolean;
  createdAt: string;
}

export interface ReviewPage {
  content: Review[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface ReviewLikeResponse {
  liked: boolean;
  likeCount: number;
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
  categoryName: string | null;
  thumbnailUrl: string | null;
  description: string;
  productInfo: string;
  viewCount: number;
  createdAt: string;
  deletedAt: string | null;
  images: ProductImage[];
  optionGroups: ProductOptionGroup[];
}

export interface InventoryItem {
  productId: number;
  productName: string;
  basePrice: number;
  optionValueId: number;
  optionValue: string;
  stockQuantity: number;
  status: '정상' | '부족' | '품절';
}

export interface AdminProductOptionUpdate {
  id: number | null; // null이면 신규
  value: string;
  additionalPrice: number;
  stockQuantity: number;
}

export interface CreateProductRequest {
  name: string;
  basePrice: number;
  discountRate: number;
  categoryId: number;
  description: string;
  productInfo: string;
  status: string;
  images?: { url: string; sortOrder: number; isThumbnail: boolean; detail: boolean }[];
  optionGroups: {
    name: string;
    optionValues: { value: string; additionalPrice: number; stockQuantity: number }[];
  }[];
}

// 관리자 - 주문
export type PaymentMethod = "CARD" | "TRANSFER" | "VIRTUAL";

export interface AdminOrder {
  id: number;
  orderNumber: string;
  memberId: number;
  memberName: string;
  recipient: string;
  phone: string;
  address: string;
  memo: string;
  carrier: string | null;
  trackingNumber: string | null;
  totalAmount: number;
  discountAmount: number;
  deliveryFee: number;
  finalAmount: number;
  paymentMethod: PaymentMethod | null;
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

export interface AdminMemberAddress {
  id: number;
  label: string;
  recipient: string;
  phone: string;
  zipcode: string;
  address: string;
  addressDetail: string;
  defaultAddress: boolean;
}

export interface AdminMemberRecentOrder {
  orderId: number;
  orderNumber: string;
  status: string;
  finalAmount: number;
  createdAt: string;
}

export interface AdminMemberDetail {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: string;
  provider: string;
  createdAt: string;
  deletedAt: string | null;
  passwordChangedAt: string | null;
  adminMemo: string | null;

  totalOrderCount: number;
  paidOrderCount: number;
  cancelledOrCancelRefundCount: number;
  totalPaidAmount: number;
  averageOrderValue: number;
  lastOrderAt: string | null;

  couponTotalCount: number;
  couponUsableCount: number;
  couponUsedCount: number;
  couponExpiredCount: number;
  reviewCount: number;
  reviewAverageRating: number | null;
  wishlistCount: number;
  returnExchangeCount: number;

  addresses: AdminMemberAddress[];
  recentOrders: AdminMemberRecentOrder[];
}

// 관리자 - 쿠폰
export interface AdminCoupon {
  id: number;
  name: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  totalQuantity: number | null;
  issuedQuantity: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  isWelcome: boolean;
  validDays: number | null;
}

// 배너 (공개)
export interface Banner {
  id: number;
  imageUrl: string;
  sortOrder: number;
  active: boolean;
  linkUrl: string | null;
  title: string | null;
  createdAt: string;
}

// 배너 (어드민) — 연결 상품 메타 + 원본 입력값 포함
export interface AdminBanner {
  id: number;
  imageUrl: string;
  sortOrder: number;
  active: boolean;
  title: string | null;
  createdAt: string;
  productId: number | null;
  linkUrl: string | null;
  linkedProduct: LinkedProduct | null;
}

export interface LinkedProduct {
  id: number;
  name: string;
  thumbnailUrl: string | null;
  status: "ACTIVE" | "SOLDOUT" | "INACTIVE";
  deleted: boolean;
}

// 메인 페이지 설정
export interface MainPageConfig {
  subText: string | null;
  aboutImageUrl: string | null;
  instagramHandle: string | null;
  instagramItems: InstagramItem[];
}

export interface InstagramItem {
  imageUrl: string | null;
  linkUrl: string | null;
}

// 메인 페이지 NEW ARRIVALS 큐레이션 (어드민)
export interface NewArrivalEntry {
  id: number;
  sortOrder: number;
  product: Product;
}

// 반품/교환
export type ReasonType = 'RETURN' | 'EXCHANGE';
export type ReasonCategory = 'CHANGE_OF_MIND' | 'SELLER_FAULT';
export type RequestStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export type ReasonDetail =
  | 'DISLIKE' | 'WRONG_SIZE' | 'WRONG_ORDER' | 'FOUND_CHEAPER'
  | 'WRONG_ITEM_SENT' | 'WRONG_OPTION_SENT' | 'PRODUCT_DEFECT'
  | 'DIFFERENT_FROM_DESC' | 'SEWING_DEFECT';

export interface ReturnExchangeRequest {
  id: number;
  orderId: number;
  orderNumber: string;
  type: ReasonType;
  reasonDetail: ReasonDetail;
  reasonDetailLabel: string;
  reasonCategory: ReasonCategory;
  reasonText: string;
  status: RequestStatus;
  adminMemo: string | null;
  imageUrls: string[];
  desiredOptionValueId: number | null;
  desiredOptionValue: string | null;
  createdAt: string;
}

// 관리자 - 대시보드
export interface AdminDashboardDailyRevenue {
  date: string; // YYYY-MM-DD
  amount: number;
}

export interface AdminDashboardLowStock {
  productId: number;
  productName: string;
  optionValueId: number;
  optionValue: string;
  stockQuantity: number;
}

export interface AdminDashboardRecentOrder {
  orderId: number;
  orderNumber: string;
  memberEmail: string;
  finalAmount: number;
  status: string;
  createdAt: string;
}

export interface AdminDashboardTopProduct {
  productId: number;
  productName: string;
  salesCount: number;
  thumbnailUrl: string | null;
}

export interface AdminDashboardOrderStatusCount {
  status: string;
  count: number;
}

export interface AdminDashboard {
  todayOrderCount: number;
  monthlyRevenue: number;
  totalMemberCount: number;
  pendingRequestCount: number;
  monthlyAverageOrderValue: number;
  newMembersThisMonth: number;
  unansweredQnaCount: number;
  dailyRevenue: AdminDashboardDailyRevenue[];
  lowStockProducts: AdminDashboardLowStock[];
  recentOrders: AdminDashboardRecentOrder[];
  topProducts: AdminDashboardTopProduct[];
  orderStatusCounts: AdminDashboardOrderStatusCount[];
}

export interface CreateCouponRequest {
  name: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  totalQuantity?: number;
  startDate: string;
  endDate: string;
  isWelcome?: boolean;
  validDays?: number;
}

// Notice
export interface NoticeListItem {
  id: number;
  title: string;
  pinned: boolean;
  viewCount: number;
  createdAt: string;
}

export interface NoticeNavigation {
  id: number;
  title: string;
}

export interface NoticeDetail {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  prev: NoticeNavigation | null;
  next: NoticeNavigation | null;
}

export interface NoticeRequest {
  title: string;
  content: string;
  pinned: boolean;
}

// Support (FAQ + Q&A 공유)
export type SupportCategory = "DELIVERY" | "EXCHANGE" | "PAYMENT" | "MEMBER" | "PRODUCT" | "ETC";

// Q&A
export interface QnaListItem {
  id: number;
  category: SupportCategory;
  categoryLabel: string;
  title: string;
  secret: boolean;
  answered: boolean;
  visible: boolean;
  authorMasked: string;
  createdAt: string;
  answeredAt: string | null;
}

export interface QnaDetail {
  id: number;
  category: SupportCategory;
  categoryLabel: string;
  title: string;
  content: string;
  secret: boolean;
  answer: string | null;
  answeredAt: string | null;
  answered: boolean;
  authorId: number | null;
  authorName: string | null;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface QnaCreateRequest {
  category: SupportCategory;
  title: string;
  content: string;
  secret: boolean;
  imageUrls?: string[];
}

export interface QnaUpdateRequest {
  category: SupportCategory;
  title: string;
  content: string;
  secret: boolean;
}

export interface QnaAnswerRequest {
  answer: string;
}

// Answer Template
export interface AnswerTemplate {
  id: number;
  title: string;
  content: string;
  sortOrder: number;
}

export interface AnswerTemplateRequest {
  title: string;
  content: string;
}

export interface Faq {
  id: number;
  category: SupportCategory;
  categoryLabel: string;
  question: string;
  answer: string;
  sortOrder: number;
}

export interface FaqRequest {
  category: SupportCategory;
  question: string;
  answer: string;
}

export interface FaqSortRequest {
  items: { id: number; sortOrder: number }[];
}

// Season Collection (PNTK)
export interface SeasonSummary {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  imageCount: number;
}

export interface SeasonImage {
  id: number;
  imageUrl: string;
  sortOrder: number;
}

export interface SeasonDetail {
  id: number;
  name: string;
  slug: string;
  images: SeasonImage[];
}

export interface SeasonOrderItem {
  id: number;
  sortOrder: number;
}
