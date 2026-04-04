import api from "./api";
import type { ApiResponse } from "@/types";

interface ConfirmPaymentRequest {
  paymentKey: string;
  orderNumber: string;
  amount: number;
}

interface ConfirmPaymentResponse {
  orderId: number;
  orderNumber: string;
  paymentKey: string;
  amount: number;
  status: string;
}

export async function confirmPayment(data: ConfirmPaymentRequest) {
  const res = await api.post<ApiResponse<ConfirmPaymentResponse>>(
    "/api/payments/confirm",
    data
  );
  return res.data;
}
