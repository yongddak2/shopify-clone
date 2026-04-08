"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrderDetail, cancelOrder } from "@/lib/order";
import {
  invalidateOrderRelated,
  invalidateProductRelated,
} from "@/lib/queryInvalidator";
import { useAuthStore } from "@/stores/authStore";
import Button from "@/components/common/Button";

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "주문대기",
  PAID: "결제완료",
  PREPARING: "배송준비중",
  SHIPPED: "배송중",
  DELIVERED: "배송완료",
  CANCELLED: "주문취소",
  REFUNDED: "환불완료",
};

export default function OrderDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
    }
  }, [isLoggedIn, router]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrderDetail(Number(id)),
    enabled: isLoggedIn(),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(Number(id)),
    onSuccess: () => {
      invalidateOrderRelated(queryClient);
      invalidateProductRelated(queryClient);
    },
    onError: () => {
      alert("주문 취소에 실패했습니다.");
    },
  });

  const handleCancel = () => {
    if (confirm("주문을 취소하시겠습니까?")) {
      cancelMutation.mutate();
    }
  };

  if (!isLoggedIn()) return null;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-12">
        <div className="space-y-6">
          <div className="h-8 bg-[var(--skeleton)] animate-pulse w-1/3 mx-auto" />
          <div className="h-40 bg-[var(--skeleton)] animate-pulse" />
          <div className="h-40 bg-[var(--skeleton)] animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="text-center py-20 text-[var(--text-muted)] text-sm">
        주문을 찾을 수 없습니다.
      </div>
    );
  }

  const order = data.data;
  const statusLabel = STATUS_LABELS[order.status] ?? order.status;
  const canCancel = order.status === "PENDING" || order.status === "PAID";

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10 py-12">
      <h1 className="text-2xl tracking-[0.2em] font-light text-center mb-12 text-[var(--text-primary)]">
        ORDER DETAIL
      </h1>

      {/* 주문 정보 */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1">
              {formatDate(order.createdAt)}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">{order.orderNumber}</p>
          </div>
          <span className="inline-block px-3 py-1 text-xs rounded text-[var(--text-secondary)] bg-[var(--card-bg)] border border-[var(--border-color)]">
            {statusLabel}
          </span>
        </div>
      </section>

      {/* 주문 상품 */}
      <section className="mb-10">
        <h2 className="text-xs tracking-widest text-[var(--text-muted)] mb-4">
          ORDER ITEMS
        </h2>
        <div className="border-t border-[var(--border-color)]">
          {order.orderItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 py-4 border-b border-[var(--border-color)]"
            >
              <div className="w-[60px] h-[60px] bg-[var(--card-bg)] flex-shrink-0 overflow-hidden">
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt={item.productNameSnapshot} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[var(--section-bg)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${item.productId}`}
                  className="text-sm text-[var(--text-secondary)] hover:underline"
                >
                  {item.productNameSnapshot}
                </Link>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {item.optionInfoSnapshot} / {item.quantity}개
                </p>
              </div>
              <div className="text-right ml-4 flex-shrink-0">
                <p className="text-xs text-[var(--text-muted)]">
                  {formatPrice(item.priceSnapshot)}원 x {item.quantity}
                </p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {formatPrice(item.subtotal)}원
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 배송 정보 */}
      <section className="mb-10">
        <h2 className="text-xs tracking-widest text-[var(--text-muted)] mb-4">
          DELIVERY INFO
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex mb-4">
            <span className="w-20 text-[var(--text-muted)] flex-shrink-0">배송상태</span>
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              {statusLabel}
            </span>
          </div>
          <div className="flex">
            <span className="w-20 text-[var(--text-muted)] flex-shrink-0">수령인</span>
            <span className="text-[var(--text-secondary)]">{order.recipient}</span>
          </div>
          <div className="flex">
            <span className="w-20 text-[var(--text-muted)] flex-shrink-0">연락처</span>
            <span className="text-[var(--text-secondary)]">{order.phone}</span>
          </div>
          <div className="flex">
            <span className="w-20 text-[var(--text-muted)] flex-shrink-0">주소</span>
            <span className="text-[var(--text-secondary)]">{order.address}</span>
          </div>
          {order.memo && (
            <div className="flex">
              <span className="w-20 text-[var(--text-muted)] flex-shrink-0">메모</span>
              <span className="text-[var(--text-secondary)]">{order.memo}</span>
            </div>
          )}
        </div>
      </section>

      {/* 결제 정보 */}
      <section className="mb-10 border-t border-[var(--border-color)] pt-8">
        <h2 className="text-xs tracking-widest text-[var(--text-muted)] mb-4">
          PAYMENT
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-muted)]">총 상품 금액</span>
            <span className="text-[var(--text-secondary)]">{formatPrice(order.totalAmount)}원</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-muted)]">배송비</span>
            <span className="text-[var(--text-secondary)]">
              {order.deliveryFee === 0
                ? "무료"
                : `${formatPrice(order.deliveryFee)}원`}
            </span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">할인 금액</span>
              <span className="text-red-400">
                -{formatPrice(order.discountAmount)}원
              </span>
            </div>
          )}
          <div className="flex justify-between text-base font-medium pt-4 border-t border-[var(--border-color)]">
            <span className="text-[var(--text-primary)]">최종 결제 금액</span>
            <span className="text-[var(--text-primary)]">{formatPrice(order.finalAmount)}원</span>
          </div>
        </div>
      </section>

      {/* 주문 취소 */}
      {canCancel && (
        <Button
          variant="outline"
          fullWidth
          onClick={handleCancel}
          loading={cancelMutation.isPending}
        >
          주문 취소
        </Button>
      )}
    </div>
  );
}
