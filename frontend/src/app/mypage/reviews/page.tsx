"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrders } from "@/lib/order";
import { createReview } from "@/lib/review";
import { useAuthStore } from "@/stores/authStore";
import { Star } from "lucide-react";
import type { OrderResponse, OrderItemResponse } from "@/types";

interface ReviewableItem {
  orderItemId: number;
  productNameSnapshot: string;
  optionInfoSnapshot: string;
  thumbnailUrl: string | null;
}

export default function MypageReviewsPage() {
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuthStore();
  const [reviewForm, setReviewForm] = useState<{
    orderItemId: number;
    rating: number;
    content: string;
  } | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["orders", 0],
    queryFn: () => getOrders(0, 100),
    enabled: isLoggedIn(),
  });

  const reviewMutation = useMutation({
    mutationFn: (data: { orderItemId: number; rating: number; content?: string }) =>
      createReview(data),
    onSuccess: (_, variables) => {
      setReviewedIds((prev) => new Set(prev).add(variables.orderItemId));
      setReviewForm(null);
      setError("");
    },
    onError: () => {
      setError("리뷰 작성에 실패했습니다.");
    },
  });

  const handleSubmit = () => {
    if (!reviewForm) return;
    if (reviewForm.rating === 0) {
      setError("별점을 선택해주세요.");
      return;
    }
    setError("");
    reviewMutation.mutate({
      orderItemId: reviewForm.orderItemId,
      rating: reviewForm.rating,
      content: reviewForm.content.trim() || undefined,
    });
  };

  const orders = data?.data?.content ?? [];
  const deliveredOrders = orders.filter(
    (o: OrderResponse) => o.status === "DELIVERED"
  );

  const reviewableItems: ReviewableItem[] = [];
  for (const order of deliveredOrders) {
    if (!order.orderItems) continue;
    for (const item of order.orderItems) {
      reviewableItems.push({
        orderItemId: item.id,
        productNameSnapshot: item.productNameSnapshot,
        optionInfoSnapshot: item.optionInfoSnapshot,
        thumbnailUrl: (item as OrderItemResponse).thumbnailUrl ?? null,
      });
    }
  }

  return (
    <div>
      <h2 className="text-lg tracking-[0.1em] font-light text-[var(--text-primary)] mb-8">
        리뷰 관리
      </h2>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-[var(--skeleton)] animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && reviewableItems.length === 0 && (
        <div className="text-center py-20">
          <p className="text-sm text-[var(--text-muted)]">
            배송 완료된 상품이 없습니다.
          </p>
        </div>
      )}

      {!isLoading && reviewableItems.length > 0 && (
        <div className="space-y-4">
          {reviewableItems.map((item) => {
            const isReviewed = reviewedIds.has(item.orderItemId);
            const isEditing = reviewForm?.orderItemId === item.orderItemId;

            return (
              <div
                key={item.orderItemId}
                className="border border-[var(--border-color)] p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-[60px] h-[60px] bg-[var(--card-bg)] flex-shrink-0 overflow-hidden">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.productNameSnapshot}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[var(--section-bg)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-secondary)]">
                      {item.productNameSnapshot}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {item.optionInfoSnapshot}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {isReviewed ? (
                      <span className="px-2 py-1 text-xs bg-[var(--badge-green-bg)] text-[var(--badge-green-text)] rounded">
                        리뷰 작성완료
                      </span>
                    ) : !isEditing ? (
                      <button
                        onClick={() => {
                          setReviewForm({
                            orderItemId: item.orderItemId,
                            rating: 0,
                            content: "",
                          });
                          setError("");
                        }}
                        className="px-3 py-1.5 text-xs border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        리뷰 작성
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* 리뷰 작성 폼 */}
                {isEditing && reviewForm && (
                  <div className="mt-4 pt-4 border-t border-[var(--border-color)] space-y-4">
                    {/* 별점 */}
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-2">별점</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() =>
                              setReviewForm({ ...reviewForm, rating: star })
                            }
                            className="transition-colors"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= reviewForm.rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-[var(--text-dim)]"
                              }`}
                              strokeWidth={1.5}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 내용 */}
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-2">
                        리뷰 내용 (선택)
                      </p>
                      <textarea
                        value={reviewForm.content}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            content: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)] transition-colors placeholder-[var(--text-dim)]"
                        placeholder="상품에 대한 솔직한 리뷰를 남겨주세요."
                      />
                    </div>

                    <div className="min-h-[1.25rem]">
                      {error && <p className="text-xs text-red-400">{error}</p>}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setReviewForm(null);
                          setError("");
                        }}
                        className="flex-1 py-2.5 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={reviewMutation.isPending}
                        className="flex-1 py-2.5 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors"
                      >
                        {reviewMutation.isPending ? "등록 중..." : "리뷰 등록"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
