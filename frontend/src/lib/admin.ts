import api from "./api";
import type {
  ApiResponse,
  PageResponse,
  AdminProduct,
  CreateProductRequest,
  AdminOrder,
  AdminUser,
  AdminCoupon,
  CreateCouponRequest,
  Category,
  Banner,
  AdminBanner,
  MainPageConfig,
  InstagramItem,
  NewArrivalEntry,
  Product,
  ReturnExchangeRequest,
  InventoryItem,
  AdminDashboard,
  AdminMemberDetail,
  NoticeDetail,
  NoticeListItem,
  NoticeRequest,
  Faq,
  FaqRequest,
  FaqSortRequest,
  QnaListItem,
  QnaDetail,
  QnaAnswerRequest,
  SupportCategory,
  AnswerTemplate,
  AnswerTemplateRequest,
  SeasonSummary,
  SeasonImage,
  SeasonOrderItem,
} from "@/types";

// 대시보드
export async function getDashboard(): Promise<AdminDashboard> {
  const res = await api.get<ApiResponse<AdminDashboard>>("/api/admin/dashboard");
  return res.data.data;
}

// 이미지 업로드/삭제
export async function uploadProductImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<ApiResponse<string>>("/api/admin/images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

// 상세 설명 이미지 전용 (10MB 허용)
export async function uploadProductDetailImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<ApiResponse<string>>("/api/admin/images/detail", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

export async function deleteProductImage(imageUrl: string): Promise<void> {
  await api.delete("/api/admin/images", { params: { imageUrl } });
}

// 카테고리 (공개 API)
export async function getCategories() {
  const res = await api.get<ApiResponse<Category[]>>("/api/categories");
  return res.data;
}

// 상품 관리
export async function getAdminProducts(page = 0, keyword = "", categoryId?: number) {
  const res = await api.get<ApiResponse<PageResponse<AdminProduct>>>(
    "/api/admin/products",
    {
      params: {
        page,
        size: 20,
        sort: "id,desc",
        keyword: keyword || undefined,
        categoryId: categoryId ?? undefined,
      },
    }
  );
  return res.data;
}

export async function getAdminProduct(id: number) {
  const res = await api.get<ApiResponse<AdminProduct>>(
    `/api/admin/products/${id}`
  );
  return res.data.data;
}

export async function createProduct(data: CreateProductRequest) {
  const res = await api.post<ApiResponse<AdminProduct>>(
    "/api/admin/products",
    data
  );
  return res.data;
}

export async function updateProduct(
  id: number,
  data: Record<string, unknown>
) {
  const res = await api.patch<ApiResponse<AdminProduct>>(
    `/api/admin/products/${id}`,
    data
  );
  return res.data;
}

export async function deleteProduct(id: number) {
  const res = await api.delete<ApiResponse<null>>(
    `/api/admin/products/${id}`
  );
  return res.data;
}

// 재고 관리
export async function getInventory(): Promise<InventoryItem[]> {
  const res = await api.get<ApiResponse<InventoryItem[]>>("/api/admin/inventory");
  return res.data.data;
}

export async function updateStock(
  optionValueId: number,
  stockQuantity: number
): Promise<InventoryItem> {
  const res = await api.patch<ApiResponse<InventoryItem>>(
    `/api/admin/inventory/${optionValueId}`,
    { stockQuantity }
  );
  return res.data.data;
}

// 주문 관리
export interface AdminOrderFilters {
  page?: number;
  size?: number;
  status?: string;
  startDate?: string;  // YYYY-MM-DD
  endDate?: string;    // YYYY-MM-DD
  searchType?: string;
  keyword?: string;
}

export async function getAdminOrders(filters: AdminOrderFilters = {}) {
  const { page = 0, size = 20, status, startDate, endDate, searchType, keyword } = filters;
  const params: Record<string, string | number> = { page, size, sort: "id,desc" };
  if (status) params.status = status;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (searchType && keyword) {
    params.searchType = searchType;
    params.keyword = keyword;
  }
  const res = await api.get<ApiResponse<PageResponse<AdminOrder>>>(
    "/api/admin/orders",
    { params }
  );
  return res.data;
}

export async function updateOrderStatus(
  id: number,
  status: string,
  shipping?: { carrier: string; trackingNumber: string }
) {
  const body: Record<string, string> = { status };
  if (shipping) {
    body.carrier = shipping.carrier;
    body.trackingNumber = shipping.trackingNumber;
  }
  const res = await api.patch<ApiResponse<AdminOrder>>(
    `/api/admin/orders/${id}/status`,
    body
  );
  return res.data;
}

export async function updateOrderShipping(
  id: number,
  shipping: { carrier: string; trackingNumber: string }
) {
  const res = await api.patch<ApiResponse<null>>(
    `/api/admin/orders/${id}/shipping`,
    shipping
  );
  return res.data;
}

// 회원 관리
export async function getAdminUsers(page = 0, filter?: string) {
  const params: Record<string, string | number> = { page, size: 20, sort: "id,desc" };
  if (filter) params.filter = filter;
  const res = await api.get<ApiResponse<PageResponse<AdminUser>>>(
    "/api/admin/users",
    { params }
  );
  return res.data;
}

export async function getAdminUserDetail(id: number): Promise<AdminMemberDetail> {
  const res = await api.get<ApiResponse<AdminMemberDetail>>(`/api/admin/users/${id}`);
  return res.data.data;
}

export async function updateAdminUserRole(id: number, role: "USER" | "ADMIN"): Promise<AdminMemberDetail> {
  const res = await api.patch<ApiResponse<AdminMemberDetail>>(
    `/api/admin/users/${id}/role`,
    { role }
  );
  return res.data.data;
}

export async function updateAdminUserMemo(id: number, adminMemo: string): Promise<AdminMemberDetail> {
  const res = await api.patch<ApiResponse<AdminMemberDetail>>(
    `/api/admin/users/${id}/memo`,
    { adminMemo }
  );
  return res.data.data;
}

export async function withdrawAdminUser(id: number): Promise<void> {
  await api.delete(`/api/admin/users/${id}`);
}

// 쿠폰 관리
export async function getAdminCoupons(page = 0) {
  const res = await api.get<ApiResponse<PageResponse<AdminCoupon>>>(
    "/api/admin/coupons",
    { params: { page, size: 20 } }
  );
  return res.data;
}

export async function createCoupon(data: CreateCouponRequest) {
  const res = await api.post<ApiResponse<AdminCoupon>>(
    "/api/admin/coupons",
    data
  );
  return res.data;
}

export interface UpdateCouponRequest {
  name: string;
  totalQuantity?: number;
  startDate: string;
  endDate: string;
  isWelcome?: boolean;
  validDays?: number;
}

export async function updateCoupon(id: number, data: UpdateCouponRequest) {
  const res = await api.patch<ApiResponse<AdminCoupon>>(
    `/api/admin/coupons/${id}`,
    data
  );
  return res.data;
}

export async function deleteCoupon(id: number) {
  const res = await api.delete<ApiResponse<null>>(
    `/api/admin/coupons/${id}`
  );
  return res.data;
}

// 배너 관리
export async function getBanners() {
  const res = await api.get<ApiResponse<AdminBanner[]>>("/api/admin/banners");
  return res.data;
}

export interface BannerLinkInput {
  productId: number | null;
  linkUrl: string | null;
}

export async function createBanner(
  imageUrl: string,
  sortOrder: number,
  title: string,
  link: BannerLinkInput
) {
  const res = await api.post<ApiResponse<AdminBanner>>("/api/admin/banners", {
    imageUrl,
    sortOrder,
    title,
    productId: link.productId,
    linkUrl: link.linkUrl,
  });
  return res.data;
}

export async function updateBanner(id: number, title: string, link: BannerLinkInput) {
  const res = await api.put<ApiResponse<AdminBanner>>(`/api/admin/banners/${id}`, {
    title,
    productId: link.productId,
    linkUrl: link.linkUrl,
  });
  return res.data;
}

export async function updateBannerOrder(
  orders: { id: number; sortOrder: number }[]
) {
  const res = await api.put<ApiResponse<null>>("/api/admin/banners/order", orders);
  return res.data;
}

export async function toggleBannerActive(id: number) {
  const res = await api.patch<ApiResponse<AdminBanner>>(
    `/api/admin/banners/${id}/toggle`
  );
  return res.data;
}

export async function deleteBanner(id: number) {
  const res = await api.delete<ApiResponse<null>>(`/api/admin/banners/${id}`);
  return res.data;
}

// 배너 이미지 업로드 (directory: banners)
export async function uploadBannerImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("directory", "banners");
  const res = await api.post<ApiResponse<string>>("/api/admin/images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

// ABOUT 이미지 업로드 (directory: about)
export async function uploadAboutImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("directory", "about");
  const res = await api.post<ApiResponse<string>>("/api/admin/images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

// ABOUT 이미지 URL 설정 (null → 제거)
export async function updateAboutImage(imageUrl: string | null) {
  const res = await api.put<ApiResponse<MainPageConfig>>(
    "/api/admin/main-page-config/about-image",
    { imageUrl }
  );
  return res.data;
}

export async function uploadInstagramImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("directory", "instagram");
  const res = await api.post<ApiResponse<string>>("/api/admin/images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

export async function updateInstagramSection(
  handle: string | null,
  items: InstagramItem[]
) {
  const res = await api.put<ApiResponse<MainPageConfig>>(
    "/api/admin/main-page-config/instagram",
    { handle, items }
  );
  return res.data;
}

// 공개 배너 조회
export async function getPublicBanners() {
  const res = await api.get<ApiResponse<Banner[]>>("/api/banners");
  return res.data;
}

// 메인 페이지 설정 (관리자)
export async function getAdminMainPageConfig() {
  const res = await api.get<ApiResponse<MainPageConfig>>("/api/admin/main-page-config");
  return res.data;
}

export async function updateMainPageConfig(subText: string | null) {
  const res = await api.put<ApiResponse<MainPageConfig>>("/api/admin/main-page-config", {
    subText,
  });
  return res.data;
}

// 메인 페이지 설정 (공개)
export async function getPublicMainPageConfig() {
  const res = await api.get<ApiResponse<MainPageConfig>>("/api/main-page-config");
  return res.data;
}

// 메인 페이지 NEW ARRIVALS 큐레이션 (관리자)
export async function getAdminNewArrivals() {
  const res = await api.get<ApiResponse<NewArrivalEntry[]>>(
    "/api/admin/main-page/new-arrivals"
  );
  return res.data;
}

export async function addNewArrivals(productIds: number[]) {
  const res = await api.post<ApiResponse<NewArrivalEntry[]>>(
    "/api/admin/main-page/new-arrivals",
    { productIds }
  );
  return res.data;
}

export async function deleteNewArrival(id: number) {
  await api.delete(`/api/admin/main-page/new-arrivals/${id}`);
}

export async function moveNewArrival(id: number, direction: "UP" | "DOWN") {
  const res = await api.patch<ApiResponse<NewArrivalEntry[]>>(
    `/api/admin/main-page/new-arrivals/${id}/move`,
    { direction }
  );
  return res.data;
}

export async function reorderNewArrivals(orderedIds: number[]) {
  const res = await api.put<ApiResponse<NewArrivalEntry[]>>(
    "/api/admin/main-page/new-arrivals/order",
    { orderedIds }
  );
  return res.data;
}

export async function replaceNewArrivals(productIds: number[]) {
  const res = await api.put<ApiResponse<NewArrivalEntry[]>>(
    "/api/admin/main-page/new-arrivals",
    { productIds }
  );
  return res.data;
}

// 메인 페이지 NEW ARRIVALS (공개)
export async function getPublicNewArrivals() {
  const res = await api.get<ApiResponse<Product[]>>("/api/main-page/new-arrivals");
  return res.data;
}

// 반품/교환 관리
export async function getAdminRequests(page = 0) {
  const res = await api.get<ApiResponse<PageResponse<ReturnExchangeRequest>>>(
    "/api/admin/requests",
    { params: { page, size: 20, sort: "id,desc" } }
  );
  return res.data;
}

export async function approveRequest(id: number, adminMemo?: string) {
  const res = await api.patch<ApiResponse<ReturnExchangeRequest>>(
    `/api/admin/requests/${id}/approve`,
    { adminMemo }
  );
  return res.data.data;
}

export async function rejectRequest(id: number, adminMemo: string) {
  const res = await api.patch<ApiResponse<ReturnExchangeRequest>>(
    `/api/admin/requests/${id}/reject`,
    { adminMemo }
  );
  return res.data.data;
}

export async function completeRequest(id: number) {
  const res = await api.patch<ApiResponse<ReturnExchangeRequest>>(
    `/api/admin/requests/${id}/complete`
  );
  return res.data.data;
}

// 공지사항 관리
export async function getAdminNotices(page = 0, keyword = "") {
  const res = await api.get<ApiResponse<PageResponse<NoticeListItem>>>(
    "/api/admin/notices",
    { params: { page, size: 20, keyword: keyword || undefined } }
  );
  return res.data;
}

export async function getAdminNotice(id: number) {
  const res = await api.get<ApiResponse<NoticeDetail>>(`/api/admin/notices/${id}`);
  return res.data.data;
}

export async function createNotice(data: NoticeRequest) {
  const res = await api.post<ApiResponse<NoticeDetail>>("/api/admin/notices", data);
  return res.data.data;
}

export async function updateNotice(id: number, data: NoticeRequest) {
  const res = await api.patch<ApiResponse<NoticeDetail>>(`/api/admin/notices/${id}`, data);
  return res.data.data;
}

export async function deleteNotice(id: number) {
  await api.delete(`/api/admin/notices/${id}`);
}

// FAQ 관리
export async function getAdminFaqs() {
  const res = await api.get<ApiResponse<Faq[]>>("/api/admin/faqs");
  return res.data.data;
}

export async function createFaq(data: FaqRequest) {
  const res = await api.post<ApiResponse<Faq>>("/api/admin/faqs", data);
  return res.data.data;
}

export async function updateFaq(id: number, data: FaqRequest) {
  const res = await api.patch<ApiResponse<Faq>>(`/api/admin/faqs/${id}`, data);
  return res.data.data;
}

export async function deleteFaq(id: number) {
  await api.delete(`/api/admin/faqs/${id}`);
}

export async function reorderFaqs(data: FaqSortRequest) {
  await api.patch("/api/admin/faqs/sort", data);
}

// Q&A 관리
export async function getAdminQnas(
  page = 0,
  keyword = "",
  category?: SupportCategory,
  answered?: boolean
) {
  const res = await api.get<ApiResponse<PageResponse<QnaListItem>>>("/api/admin/qnas", {
    params: {
      page,
      size: 20,
      keyword: keyword || undefined,
      category: category ?? undefined,
      answered: answered ?? undefined,
    },
  });
  return res.data;
}

export async function getAdminQna(id: number) {
  const res = await api.get<ApiResponse<QnaDetail>>(`/api/admin/qnas/${id}`);
  return res.data.data;
}

export async function answerQna(id: number, data: QnaAnswerRequest) {
  const res = await api.patch<ApiResponse<QnaDetail>>(`/api/admin/qnas/${id}/answer`, data);
  return res.data.data;
}

export async function deleteQnaAnswer(id: number) {
  await api.delete(`/api/admin/qnas/${id}/answer`);
}

export async function deleteAdminQna(id: number) {
  await api.delete(`/api/admin/qnas/${id}`);
}

// 답변 템플릿 관리
export async function getAnswerTemplates() {
  const res = await api.get<ApiResponse<AnswerTemplate[]>>("/api/admin/answer-templates");
  return res.data.data;
}

export async function createAnswerTemplate(data: AnswerTemplateRequest) {
  const res = await api.post<ApiResponse<AnswerTemplate>>("/api/admin/answer-templates", data);
  return res.data.data;
}

export async function updateAnswerTemplate(id: number, data: AnswerTemplateRequest) {
  const res = await api.patch<ApiResponse<AnswerTemplate>>(`/api/admin/answer-templates/${id}`, data);
  return res.data.data;
}

export async function deleteAnswerTemplate(id: number) {
  await api.delete(`/api/admin/answer-templates/${id}`);
}

// ───────────────────────────────────────────
// Season Collection (PNTK)
// ───────────────────────────────────────────
export async function getAdminSeasons() {
  const res = await api.get<ApiResponse<SeasonSummary[]>>("/api/admin/season-collections");
  return res.data.data;
}

export async function createSeason(name: string) {
  const res = await api.post<ApiResponse<SeasonSummary>>("/api/admin/season-collections", { name });
  return res.data.data;
}

export async function updateSeasonName(id: number, name: string) {
  const res = await api.patch<ApiResponse<SeasonSummary>>(`/api/admin/season-collections/${id}`, { name });
  return res.data.data;
}

export async function toggleSeasonActive(id: number) {
  const res = await api.patch<ApiResponse<SeasonSummary>>(`/api/admin/season-collections/${id}/toggle`);
  return res.data.data;
}

export async function reorderSeasons(orders: SeasonOrderItem[]) {
  await api.put("/api/admin/season-collections/order", orders);
}

export async function deleteSeason(id: number) {
  await api.delete(`/api/admin/season-collections/${id}`);
}

export async function getSeasonImages(id: number) {
  const res = await api.get<ApiResponse<SeasonImage[]>>(`/api/admin/season-collections/${id}/images`);
  return res.data.data;
}

export async function uploadSeasonImages(id: number, files: File[]): Promise<SeasonImage[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  const res = await api.post<ApiResponse<SeasonImage[]>>(
    `/api/admin/season-collections/${id}/images`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data.data;
}

export async function reorderSeasonImages(id: number, orders: SeasonOrderItem[]) {
  await api.put(`/api/admin/season-collections/${id}/images/order`, orders);
}

export async function deleteSeasonImage(imageId: number) {
  await api.delete(`/api/admin/season-collections/images/${imageId}`);
}
