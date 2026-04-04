"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBanners,
  createBanner,
  updateBannerOrder,
  toggleBannerActive,
  deleteBanner,
  uploadBannerImage,
} from "@/lib/admin";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import type { Banner } from "@/types";

const MAX_BANNERS = 5;
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function AdminBannersPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: getBanners,
  });

  const banners = data?.data ?? [];
  const sorted = [...banners].sort((a, b) => a.sortOrder - b.sortOrder);

  const createMutation = useMutation({
    mutationFn: (imageUrl: string) =>
      createBanner(imageUrl, banners.length + 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
    },
    onError: () => setError("배너 추가에 실패했습니다."),
  });

  const orderMutation = useMutation({
    mutationFn: (orders: { id: number; sortOrder: number }[]) =>
      updateBannerOrder(orders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
    },
    onError: () => setError("순서 변경에 실패했습니다."),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => toggleBannerActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
      setDeleteTarget(null);
    },
    onError: () => setError("삭제에 실패했습니다."),
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError("허용되지 않는 파일 형식입니다. (jpg, jpeg, png, gif, webp)");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("파일 크기는 5MB 이하만 가능합니다.");
      return;
    }

    setError("");
    setUploading(true);
    try {
      const url = await uploadBannerImage(file);
      await createMutation.mutateAsync(url);
    } catch {
      setError("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const newOrders = sorted.map((b, i) => {
      if (i === index) return { id: b.id, sortOrder: sorted[swapIdx].sortOrder };
      if (i === swapIdx) return { id: b.id, sortOrder: sorted[index].sortOrder };
      return { id: b.id, sortOrder: b.sortOrder };
    });
    orderMutation.mutate(newOrders);
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-light tracking-[0.15em] text-[var(--text-primary)]">
          배너 관리
        </h1>
        <span className="text-sm text-[var(--text-muted)]">
          현재 {banners.length} / {MAX_BANNERS}개
        </span>
      </div>

      {/* 에러 */}
      {error && (
        <p className="text-sm text-red-400 mb-4">{error}</p>
      )}

      {/* 배너 추가 */}
      <div className="mb-8">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={banners.length >= MAX_BANNERS || uploading}
          className="px-6 py-2.5 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {uploading ? "업로드 중..." : "배너 추가"}
        </button>
        {banners.length >= MAX_BANNERS && (
          <span className="ml-3 text-xs text-[var(--text-muted)]">
            최대 {MAX_BANNERS}개까지 등록 가능합니다.
          </span>
        )}
      </div>

      {/* 배너 목록 */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[120px] bg-[var(--skeleton)] animate-pulse"
            />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20 text-sm text-[var(--text-muted)]">
          등록된 배너가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((banner, idx) => (
            <div
              key={banner.id}
              className="flex items-center gap-4 bg-[var(--card-bg)] border border-[var(--border-color)] p-4"
            >
              {/* 순서 번호 */}
              <span className="text-lg font-light text-[var(--text-muted)] w-8 text-center flex-shrink-0">
                {idx + 1}
              </span>

              {/* 썸네일 */}
              <div className="w-[200px] h-[100px] bg-[var(--section-bg)] flex-shrink-0 overflow-hidden">
                <img
                  src={banner.imageUrl}
                  alt={`배너 ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--text-muted)] truncate mb-1">
                  {banner.imageUrl}
                </p>
                <p className="text-xs text-[var(--text-dim)]">
                  {new Date(banner.createdAt).toLocaleDateString("ko-KR")}
                </p>
              </div>

              {/* 활성/비활성 토글 */}
              <button
                onClick={() => toggleMutation.mutate(banner.id)}
                className={`flex-shrink-0 w-12 h-6 rounded-full relative transition-colors ${
                  banner.active
                    ? "bg-[var(--badge-green-bg)]"
                    : "bg-[var(--section-bg)]"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    banner.active ? "left-[26px]" : "left-0.5"
                  }`}
                />
              </button>
              <span className="text-xs text-[var(--text-muted)] w-10 flex-shrink-0">
                {banner.active ? "활성" : "비활성"}
              </span>

              {/* 순서 변경 */}
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button
                  onClick={() => handleMove(idx, "up")}
                  disabled={idx === 0}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMove(idx, "down")}
                  disabled={idx === sorted.length - 1}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* 삭제 */}
              <button
                onClick={() => setDeleteTarget(banner)}
                className="flex-shrink-0 p-2 text-[var(--text-muted)] hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--overlay-bg)]"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-sm w-full mx-6 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-8">
              이 배너를 삭제하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 text-sm tracking-wider border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-3 text-sm tracking-wider bg-red-500/80 text-white hover:bg-red-500 transition-colors"
              >
                {deleteMutation.isPending ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
