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
  ReturnExchangeRequest,
  InventoryItem,
} from "@/types";

// 이미지 업로드/삭제
export async function uploadProductImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<ApiResponse<string>>("/api/admin/images", formData, {
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
export async function getAdminProducts(page = 0) {
  const res = await api.get<ApiResponse<PageResponse<AdminProduct>>>(
    "/api/admin/products",
    { params: { page, size: 20, sort: "id,desc" } }
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
export async function getAdminOrders(page = 0) {
  const res = await api.get<ApiResponse<PageResponse<AdminOrder>>>(
    "/api/admin/orders",
    { params: { page, size: 20, sort: "id,desc" } }
  );
  return res.data;
}

export async function updateOrderStatus(id: number, status: string) {
  const res = await api.patch<ApiResponse<AdminOrder>>(
    `/api/admin/orders/${id}/status`,
    { status }
  );
  return res.data;
}

// 회원 관리
export async function getAdminUsers(page = 0) {
  const res = await api.get<ApiResponse<PageResponse<AdminUser>>>(
    "/api/admin/users",
    { params: { page, size: 20, sort: "id,desc" } }
  );
  return res.data;
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
  totalQuantity: number;
  startDate: string;
  endDate: string;
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
  const res = await api.get<ApiResponse<Banner[]>>("/api/admin/banners");
  return res.data;
}

export async function createBanner(imageUrl: string, sortOrder: number) {
  const res = await api.post<ApiResponse<Banner>>("/api/admin/banners", {
    imageUrl,
    sortOrder,
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
  const res = await api.patch<ApiResponse<Banner>>(
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

// 공개 배너 조회
export async function getPublicBanners() {
  const res = await api.get<ApiResponse<Banner[]>>("/api/banners");
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
