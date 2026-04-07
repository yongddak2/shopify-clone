import api from "./api";
import type {
  ApiResponse,
  PageResponse,
  OrderRequest,
  OrderResponse,
} from "@/types";

export async function getOrders(page: number = 0, size: number = 10) {
  const res = await api.get<ApiResponse<PageResponse<OrderResponse>>>(
    "/api/orders",
    { params: { page, size } }
  );
  return res.data;
}

export async function getOrderDetail(id: number) {
  const res = await api.get<ApiResponse<OrderResponse>>(
    `/api/orders/${id}`
  );
  return res.data;
}

export async function createOrder(request: OrderRequest) {
  const res = await api.post<ApiResponse<OrderResponse>>(
    "/api/orders",
    request
  );
  return res.data;
}

export async function cancelOrder(id: number) {
  const res = await api.post<ApiResponse<null>>(
    `/api/orders/${id}/cancel`
  );
  return res.data;
}

export async function confirmOrder(id: number) {
  const res = await api.post<ApiResponse<null>>(
    `/api/orders/${id}/confirm`
  );
  return res.data;
}
