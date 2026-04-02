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
} from "@/types";

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
