import api from "./api";
import type {
  ApiResponse,
  PageResponse,
  OrderRequest,
  OrderResponse,
  ReasonType,
  ReasonDetail,
  ReturnExchangeRequest,
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

// 반품/교환 신청
export async function createReturnExchangeRequest(
  orderId: number,
  data: {
    type: ReasonType;
    reasonDetail: ReasonDetail;
    reasonText: string;
    imageUrls: string[];
  }
) {
  const res = await api.post<ApiResponse<ReturnExchangeRequest>>(
    `/api/orders/${orderId}/return-exchange`,
    data
  );
  return res.data.data;
}

// 주문별 반품/교환 내역
export async function getReturnExchangeRequests(orderId: number) {
  const res = await api.get<ApiResponse<ReturnExchangeRequest[]>>(
    `/api/orders/${orderId}/return-exchange`
  );
  return res.data.data;
}

// 반품/교환 이미지 업로드
export async function uploadReturnImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<ApiResponse<string>>(
    "/api/return-requests/images",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data.data;
}
