"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrders } from "@/lib/order";
import { createReview, deleteReview, getMyReviews, uploadReviewImage } from "@/lib/review";
import { useAuthStore } from "@/stores/authStore";
import { Star, X, ImagePlus } from "lucide-react";
import Link from "next/link";
import type { OrderResponse, OrderItemResponse, Review } from "@/types";

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGES = 10;

interface ReviewableItem {
  orderId: number;
  orderItemId: number;
  productId: number;
  productNameSnapshot: string;
  optionInfoSnapshot: string;
  thumbnailUrl: string | null;
  confirmedAt: string | null;
}

interface ReviewModalState {
  mode: "create" | "edit";
  item: ReviewableItem;
  existingReview?: Review;
}

function StarInput({
  rating,
  onChange,
}: {
  rating: number;
  onChange: (r: number) => void;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="transition-colors"
        >
          <Star
            className={`w-7 h-7 ${
              star <= (hover || rating)
                ? "text-[#FFD700] fill-[#FFD700]"
                : "text-[var(--text-dim)]"
            }`}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewModal({
  state,
  onClose,
  onSuccess,
}: {
  state: ReviewModalState;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { item, mode, existingReview } = state;
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [content, setContent] = useState(existingReview?.content ?? "");
  const [imageUrls, setImageUrls] = useState<string[]>(
    existingReview?.images ?? []
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const createMutation = useMutation({
    mutationFn: (data: {
      orderItemId: number;
      rating: number;
      content?: string;
      imageUrls?: string[];
    }) => createReview(data),
    onSuccess: () => onSuccess(),
    onError: () => setError("리뷰 등록에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteReview(id),
  });

  const handleSubmit = async () => {
    if (rating === 0) return;
    setError("");

    if (mode === "edit" && existingReview) {
      try {
        await deleteMutation.mutateAsync(existingReview.id);
      } catch {
        setError("기존 리뷰 삭제에 실패했습니다.");
        return;
      }
    }

    createMutation.mutate({
      orderItemId: item.orderItemId,
      rating,
      content: content.trim() || undefined,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = MAX_IMAGES - imageUrls.length;
    if (remaining <= 0) {
      setError(`최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`);
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    for (const file of selected) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setError(`허용되지 않는 파일 형식입니다: ${file.name}`);
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`파일 크기가 10MB를 초과합니다: ${file.name}`);
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
    }

    setError("");
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of selected) {
        const url = await uploadReviewImage(file);
        urls.push(url);
      }
      setImageUrls((prev) => [...prev, ...urls]);
    } catch {
      setError("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const isPending =
    createMutation.isPending || deleteMutation.isPending || uploading;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-[var(--overlay-bg)]" onClick={onClose} />
      <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] w-full max-w-[500px] mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
          <h3 className="text-sm tracking-wider text-[var(--text-primary)]">
            {mode === "edit" ? "리뷰 수정" : "리뷰 작성"}
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* 상품 정보 */}
          <div className="flex items-center gap-4">
            <div className="w-[60px] h-[60px] bg-[var(--section-bg)] flex-shrink-0 overflow-hidden">
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
              <p className="text-sm text-[var(--text-secondary)] truncate">
                {item.productNameSnapshot}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {item.optionInfoSnapshot}
              </p>
            </div>
          </div>

          {/* 별점 */}
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-2">
              별점 <span className="text-red-400">*</span>
            </p>
            <StarInput rating={rating} onChange={setRating} />
          </div>

          {/* 리뷰 내용 */}
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-2">리뷰 내용 (선택)</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)] transition-colors placeholder-[var(--text-dim)]"
              placeholder="상품에 대한 솔직한 리뷰를 남겨주세요."
            />
          </div>

          {/* 사진 첨부 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-[var(--text-muted)]">사진 첨부 (선택)</p>
              <span className="text-xs text-[var(--text-dim)]">
                {imageUrls.length} / {MAX_IMAGES}
              </span>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || imageUrls.length >= MAX_IMAGES}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs border border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ImagePlus className="w-4 h-4" />
              {uploading ? "업로드 중..." : "사진 첨부하기"}
            </button>

            {imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 group">
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-[var(--page-bg)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 에러 */}
          <div className="min-h-[1.25rem]">
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || isPending}
              className={`flex-1 py-2.5 text-sm transition-colors ${
                rating === 0
                  ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] opacity-40 cursor-not-allowed"
                  : "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]"
              }`}
            >
              {isPending
                ? "처리 중..."
                : mode === "edit"
                  ? "리뷰 수정"
                  : "리뷰 등록"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  onConfirm,
  onCancel,
  isPending,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-[var(--overlay-bg)]" onClick={onCancel} />
      <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-sm w-full mx-6 text-center">
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          정말 삭제하시겠습니까?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 text-sm tracking-wider border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-3 text-sm tracking-wider bg-red-500/80 text-white hover:bg-red-500 transition-colors"
          >
            {isPending ? "삭제 중..." : "삭제"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MypageReviewsPage() {
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuthStore();
  const [modalState, setModalState] = useState<ReviewModalState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders", 0],
    queryFn: () => getOrders(0, 100),
    enabled: isLoggedIn(),
  });

  const { data: myReviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ["myReviews"],
    queryFn: getMyReviews,
    enabled: isLoggedIn(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteReview(id),
    onSuccess: () => {
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["myReviews"] });
    },
  });

  const isLoading = ordersLoading || reviewsLoading;
  const orders = ordersData?.data?.content ?? [];
  const myReviews: Review[] = myReviewsData?.data ?? [];

  const deliveredOrders = orders.filter(
    (o: OrderResponse) => o.status === "DELIVERED"
  );

  const reviewableItems: ReviewableItem[] = [];
  for (const order of deliveredOrders) {
    if (!order.orderItems) continue;
    for (const item of order.orderItems) {
      reviewableItems.push({
        orderId: order.id,
        orderItemId: item.id,
        productId: (item as OrderItemResponse).productId,
        productNameSnapshot: item.productNameSnapshot,
        optionInfoSnapshot: item.optionInfoSnapshot,
        thumbnailUrl: (item as OrderItemResponse).thumbnailUrl ?? null,
        confirmedAt: order.confirmedAt,
      });
    }
  }

  const getReviewForItem = (orderItemId: number): Review | undefined => {
    return myReviews.find((r) => r.orderItemId === orderItemId);
  };

  const handleModalSuccess = () => {
    setModalState(null);
    queryClient.invalidateQueries({ queryKey: ["myReviews"] });
  };

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
            const existingReview = getReviewForItem(item.orderItemId);
            const isConfirmed = item.confirmedAt !== null;

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
                    <Link
                      href={`/products/${item.productId}`}
                      className="text-sm text-[var(--text-secondary)] hover:underline cursor-pointer"
                    >
                      {item.productNameSnapshot}
                    </Link>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {item.optionInfoSnapshot}
                    </p>
                    {existingReview && (
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= existingReview.rating
                                ? "text-[#FFD700] fill-[#FFD700]"
                                : "text-[var(--text-dim)]"
                            }`}
                            strokeWidth={1.5}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {existingReview ? (
                      <>
                        <span className="px-2 py-1 text-xs text-[#10B981]">
                          작성완료
                        </span>
                        <button
                          onClick={() =>
                            setModalState({
                              mode: "edit",
                              item,
                              existingReview,
                            })
                          }
                          className="px-2.5 py-1 text-xs border border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => setDeleteTarget(existingReview)}
                          className="px-2.5 py-1 text-xs border border-[var(--border-color)] text-[var(--text-muted)] hover:border-red-400 hover:text-red-400 transition-colors"
                        >
                          삭제
                        </button>
                      </>
                    ) : !isConfirmed ? (
                      <span className="text-xs text-[var(--text-dim)]">
                        구매 확정 후 리뷰 작성 가능
                      </span>
                    ) : (
                      <button
                        onClick={() =>
                          setModalState({ mode: "create", item })
                        }
                        className="px-3 py-1.5 text-xs border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        리뷰 작성
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 리뷰 작성/수정 모달 */}
      {modalState && (
        <ReviewModal
          state={modalState}
          onClose={() => setModalState(null)}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <DeleteConfirmModal
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
