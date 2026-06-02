"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminMainPageConfig,
  uploadAboutImage,
  updateAboutImage,
} from "@/lib/admin";
import { invalidateMainPageConfigRelated } from "@/lib/queryInvalidator";

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function AboutImageSection() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "mainPageConfig"],
    queryFn: getAdminMainPageConfig,
  });

  const currentImageUrl = data?.data?.aboutImageUrl ?? null;

  const updateMutation = useMutation({
    mutationFn: (imageUrl: string | null) => updateAboutImage(imageUrl),
    onSuccess: () => {
      invalidateMainPageConfigRelated(queryClient);
      setError("");
      setRemoveConfirm(false);
    },
    onError: () => setError("이미지 저장에 실패했습니다."),
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
      setError("파일 크기는 10MB 이하만 가능합니다.");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const url = await uploadAboutImage(file);
      await updateMutation.mutateAsync(url);
    } catch {
      setError("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-12 bg-[var(--card-bg)] border border-[var(--border-color)] p-6">
      <h2 className="text-base font-light tracking-[0.15em] text-[var(--text-primary)] mb-2">
        ABOUT 페이지 이미지
      </h2>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        헤더 ABOUT 메뉴 클릭 시 표시되는 전체 화면 이미지입니다. 비워두면 ABOUT 페이지가 검은 화면으로 표시됩니다.
      </p>

      {/* 미리보기 */}
      <div className="w-full aspect-[16/9] bg-[var(--section-bg)] mb-4 overflow-hidden flex items-center justify-center">
        {isLoading ? (
          <div className="w-full h-full bg-[var(--skeleton)] animate-pulse" />
        ) : currentImageUrl ? (
          <img
            src={currentImageUrl}
            alt="ABOUT 이미지"
            className="w-full h-full object-cover"
          />
        ) : (
          <p className="text-sm text-[var(--text-dim)]">등록된 이미지가 없습니다.</p>
        )}
      </div>

      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || updateMutation.isPending}
          className="px-5 py-2 text-xs bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {uploading
            ? "업로드 중..."
            : currentImageUrl
              ? "이미지 변경"
              : "이미지 업로드"}
        </button>
        {currentImageUrl && (
          <button
            onClick={() => setRemoveConfirm(true)}
            disabled={uploading || updateMutation.isPending}
            className="px-5 py-2 text-xs border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors disabled:opacity-40"
          >
            이미지 제거
          </button>
        )}
      </div>

      {/* 제거 확인 모달 */}
      {removeConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--overlay-bg)]"
            onClick={() => setRemoveConfirm(false)}
          />
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-sm w-full mx-6 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-8">
              ABOUT 페이지 이미지를 제거하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRemoveConfirm(false)}
                className="flex-1 py-3 text-sm tracking-wider border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => updateMutation.mutate(null)}
                disabled={updateMutation.isPending}
                className="flex-1 py-3 text-sm tracking-wider bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                {updateMutation.isPending ? "제거 중..." : "제거"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
