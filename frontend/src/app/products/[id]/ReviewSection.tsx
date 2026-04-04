"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProductReviews, toggleReviewLike } from "@/lib/review";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { Star, ThumbsUp, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Review, ReviewPage } from "@/types";

const SORT_OPTIONS = [
  { value: "latest", label: "최신순" },
  { value: "rating_high", label: "별점 높은순" },
  { value: "rating_low", label: "별점 낮은순" },
  { value: "likes", label: "추천순" },
] as const;

function maskName(name: string): string {
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + "*";
  return name[0] + "*" + name[name.length - 1];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= rating ? "text-[#FFD700] fill-[#FFD700]" : "text-[var(--text-dim)]"
          }`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function PageNumbers({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    for (let i = 0; i < totalPages; i++) pages.push(i);
  } else {
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(0, currentPage - half);
    let end = start + maxVisible - 1;
    if (end >= totalPages) {
      end = totalPages - 1;
      start = end - maxVisible + 1;
    }
    if (start > 0) {
      pages.push(0);
      if (start > 1) pages.push("...");
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) {
      if (end < totalPages - 2) pages.push("...");
      pages.push(totalPages - 1);
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, idx) =>
        p === "..." ? (
          <span
            key={`ellipsis-${idx}`}
            className="w-8 h-8 flex items-center justify-center text-xs text-[var(--text-dim)]"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 flex items-center justify-center text-xs transition-colors ${
              p === currentPage
                ? "bg-[var(--text-primary)] text-[var(--page-bg)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {p + 1}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function ImageModal({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-[var(--overlay-bg)]" onClick={onClose} />
      <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>
        {images.length > 1 && (
          <button
            onClick={() => setIndex((index - 1 + images.length) % images.length)}
            className="absolute left-2 z-10 w-8 h-8 flex items-center justify-center bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <img
          src={images[index]}
          alt=""
          className="max-w-[90vw] max-h-[85vh] object-contain"
        />
        {images.length > 1 && (
          <button
            onClick={() => setIndex((index + 1) % images.length)}
            className="absolute right-2 z-10 w-8 h-8 flex items-center justify-center bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuthStore();
  const [imageModal, setImageModal] = useState<number | null>(null);

  const likeMutation = useMutation({
    mutationFn: () => toggleReviewLike(review.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["reviews"], exact: false });

      const previousQueries = queryClient.getQueriesData<{ data: ReviewPage }>({
        queryKey: ["reviews"],
      });

      queryClient.setQueriesData<{ data: ReviewPage }>(
        { queryKey: ["reviews"] },
        (old) => {
          if (!old?.data?.content) return old;
          return {
            ...old,
            data: {
              ...old.data,
              content: old.data.content.map((r) =>
                r.id === review.id
                  ? {
                      ...r,
                      liked: !r.liked,
                      likeCount: r.liked ? r.likeCount - 1 : r.likeCount + 1,
                    }
                  : r
              ),
            },
          };
        }
      );

      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"], exact: false });
    },
  });

  const handleLike = () => {
    if (!isLoggedIn()) {
      alert("로그인이 필요합니다");
      router.push("/login");
      return;
    }
    likeMutation.mutate();
  };

  return (
    <div className="py-5 border-b border-[var(--border-color)] last:border-b-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <StarRating rating={review.rating} />
          <span className="text-sm text-[var(--text-secondary)]">
            {maskName(review.memberName)}
          </span>
        </div>
        <span className="text-xs text-[var(--text-dim)]">
          {formatDate(review.createdAt)}
        </span>
      </div>

      {review.optionInfo && (
        <p className="text-xs text-[var(--text-dim)] mb-2">
          구매옵션: {review.optionInfo}
        </p>
      )}

      {review.content && (
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
          {review.content}
        </p>
      )}

      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto mb-3 pb-1">
          {review.images.map((url, i) => (
            <button
              key={i}
              onClick={() => setImageModal(i)}
              className="w-20 h-20 flex-shrink-0 overflow-hidden bg-[var(--card-bg)]"
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <button
        onClick={handleLike}
        disabled={likeMutation.isPending}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border transition-colors ${
          review.liked
            ? "border-[var(--text-muted)] bg-[var(--section-bg)] text-[var(--text-primary)]"
            : "border-[var(--border-color)] text-[var(--text-dim)] hover:border-[var(--text-muted)] hover:text-[var(--text-muted)]"
        }`}
      >
        <ThumbsUp className={`w-3.5 h-3.5 ${review.liked ? "fill-current" : ""}`} strokeWidth={1.5} />
        {review.likeCount}
      </button>

      {imageModal !== null && (
        <ImageModal
          images={review.images}
          initialIndex={imageModal}
          onClose={() => setImageModal(null)}
        />
      )}
    </div>
  );
}

export default function ReviewSection({ productId }: { productId: string }) {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("latest");

  const { data, isLoading } = useQuery({
    queryKey: ["reviews", productId, page, sort],
    queryFn: () => getProductReviews(Number(productId), page, 10, sort),
  });

  const reviewPage = data?.data;
  const reviews = reviewPage?.content ?? [];
  const totalElements = reviewPage?.totalElements ?? 0;
  const totalPages = reviewPage?.totalPages ?? 0;

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setPage(0);
  };

  return (
    <div className="mt-16 pt-10 border-t border-[var(--border-color)]">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg tracking-wide font-light text-[var(--text-primary)]">
            리뷰 ({totalElements.toLocaleString("ko-KR")}개)
          </h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" strokeWidth={1.5} />
              <span className="text-sm text-[var(--text-secondary)]">
                {avgRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="bg-[var(--input-bg)] border border-[var(--border-color)] text-sm text-[var(--text-secondary)] px-3 py-1.5 focus:outline-none focus:border-[var(--text-muted)] transition-colors"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-[var(--skeleton)] animate-pulse" />
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && reviews.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-[var(--text-muted)]">
            아직 리뷰가 없습니다.
          </p>
        </div>
      )}

      {/* 리뷰 목록 */}
      {!isLoading && reviews.length > 0 && (
        <>
          <div>
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
          <PageNumbers
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
