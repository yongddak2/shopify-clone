"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBanners,
  createBanner,
  updateBanner,
  updateBannerOrder,
  toggleBannerActive,
  deleteBanner,
  uploadBannerImage,
  getAdminMainPageConfig,
  updateMainPageConfig,
} from "@/lib/admin";
import { Menu, Trash2, Pencil } from "lucide-react";
import {
  invalidateBannerRelated,
  invalidateMainPageConfigRelated,
} from "@/lib/queryInvalidator";
import type { Banner } from "@/types";
import NewArrivalsSection from "./NewArrivalsSection";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const MAX_BANNERS = 5;
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const TITLE_MAX = 100;
const MAIN_TEXT_MAX = 500;

export default function AdminBannersPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);

  // 등록 모달용 임시 상태 (파일 보관 + 미리보기 URL)
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);

  // 수정 모달용
  const [editTarget, setEditTarget] = useState<Banner | null>(null);

  // 모달 공통 input
  const [titleInput, setTitleInput] = useState("");

  const isModalOpen = pendingFile !== null || editTarget !== null;

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: getBanners,
  });

  const banners = data?.data ?? [];
  const serverSorted = useMemo(
    () => [...banners].sort((a, b) => a.sortOrder - b.sortOrder),
    [banners]
  );
  const [localOrder, setLocalOrder] = useState<Banner[] | null>(null);
  const sorted = localOrder ?? serverSorted;

  useEffect(() => {
    setLocalOrder(null);
  }, [serverSorted]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = sorted.findIndex((b) => b.id === active.id);
    const newIdx = sorted.findIndex((b) => b.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;

    const next = arrayMove(sorted, oldIdx, newIdx);
    setLocalOrder(next);
    orderMutation.mutate(
      next.map((b, i) => ({ id: b.id, sortOrder: i + 1 }))
    );
  };

  // 메인 페이지 텍스트 설정
  const { data: configData } = useQuery({
    queryKey: ["admin", "mainPageConfig"],
    queryFn: getAdminMainPageConfig,
  });
  const [mainTextInput, setMainTextInput] = useState("");
  const [mainTextError, setMainTextError] = useState("");
  const [mainTextSaved, setMainTextSaved] = useState(false);

  useEffect(() => {
    if (configData?.data) {
      setMainTextInput(configData.data.subText ?? "");
    }
  }, [configData]);

  const mainTextMutation = useMutation({
    mutationFn: (subText: string | null) => updateMainPageConfig(subText),
    onSuccess: () => {
      invalidateMainPageConfigRelated(queryClient);
      setMainTextError("");
      setMainTextSaved(true);
      setTimeout(() => setMainTextSaved(false), 2000);
    },
    onError: () => setMainTextError("저장에 실패했습니다."),
  });

  const handleMainTextSave = () => {
    const trimmed = mainTextInput.trim();
    mainTextMutation.mutate(trimmed === "" ? null : trimmed);
  };

  const savedSubText = configData?.data?.subText ?? "";
  const mainTextChanged = mainTextInput.trim() !== savedSubText.trim();

  // 미리보기 URL revoke (메모리 누수 방지)
  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    };
  }, [pendingPreviewUrl]);

  const createMutation = useMutation({
    mutationFn: ({ imageUrl, title }: { imageUrl: string; title: string }) =>
      createBanner(imageUrl, banners.length + 1, title),
    onSuccess: () => {
      invalidateBannerRelated(queryClient);
      closeModal();
    },
    onError: () => setError("배너 추가에 실패했습니다."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      updateBanner(id, title),
    onSuccess: () => {
      invalidateBannerRelated(queryClient);
      closeModal();
    },
    onError: () => setError("수정에 실패했습니다."),
  });

  const orderMutation = useMutation({
    mutationFn: (orders: { id: number; sortOrder: number }[]) =>
      updateBannerOrder(orders),
    onSuccess: () => {
      invalidateBannerRelated(queryClient);
    },
    onError: () => {
      setError("순서 변경에 실패했습니다.");
      setLocalOrder(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => toggleBannerActive(id),
    onSuccess: () => {
      invalidateBannerRelated(queryClient);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBanner(id),
    onSuccess: () => {
      invalidateBannerRelated(queryClient);
      setDeleteTarget(null);
    },
    onError: () => setError("삭제에 실패했습니다."),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // 모달 열고 미리보기 + title 입력
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingFile(file);
    setPendingPreviewUrl(URL.createObjectURL(file));
    setTitleInput("");
    setError("");
  };

  const startEdit = (banner: Banner) => {
    setEditTarget(banner);
    setTitleInput(banner.title ?? "");
    setError("");
  };

  const closeModal = () => {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingFile(null);
    setPendingPreviewUrl(null);
    setEditTarget(null);
    setTitleInput("");
    setError("");
  };

  const handleCreateSubmit = async () => {
    if (!pendingFile) return;
    const trimmed = titleInput.trim();
    if (!trimmed) {
      setError("제목을 입력해주세요.");
      return;
    }

    setUploading(true);
    try {
      const url = await uploadBannerImage(pendingFile);
      await createMutation.mutateAsync({ imageUrl: url, title: trimmed });
    } catch {
      setError("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleEditSubmit = () => {
    if (!editTarget) return;
    const trimmed = titleInput.trim();
    if (!trimmed) {
      setError("제목을 입력해주세요.");
      return;
    }
    updateMutation.mutate({ id: editTarget.id, title: trimmed });
  };

  return (
    <div className="p-8 max-w-4xl">
      {/* 메인 페이지 텍스트 카드 */}
      <div className="mb-12 bg-[var(--card-bg)] border border-[var(--border-color)] p-6">
        <h2 className="text-base font-light tracking-[0.15em] text-[var(--text-primary)] mb-2">
          메인 페이지 텍스트
        </h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">
          메인 페이지 신상품과 BEST 섹션 사이에 큰 글씨로 표시됩니다. 비워두면 섹션 자체가 숨겨집니다.
        </p>
        <input
          type="text"
          value={mainTextInput}
          onChange={(e) => setMainTextInput(e.target.value)}
          maxLength={MAIN_TEXT_MAX}
          placeholder="예: Cool, Sensual, Effortlessly yours"
          className="w-full px-3 py-2.5 mb-2 bg-[var(--input-bg)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-secondary)]"
        />
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-[var(--text-dim)]">
            {mainTextInput.length} / {MAIN_TEXT_MAX}
          </p>
          {mainTextSaved && (
            <p className="text-[11px] text-green-600">저장되었습니다.</p>
          )}
          {mainTextError && (
            <p className="text-[11px] text-red-600">{mainTextError}</p>
          )}
        </div>
        <button
          onClick={handleMainTextSave}
          disabled={!mainTextChanged || mainTextMutation.isPending}
          className="px-5 py-2 text-xs bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {mainTextMutation.isPending ? "저장 중..." : "저장"}
        </button>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-light tracking-[0.15em] text-[var(--text-primary)]">
          배너 관리
        </h1>
        <span className="text-sm text-[var(--text-muted)]">
          현재 {banners.length} / {MAX_BANNERS}개
        </span>
      </div>

      {/* 에러 (모달 외부) */}
      {!isModalOpen && error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
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
          배너 추가
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sorted.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {sorted.map((banner, idx) => (
                <SortableBannerRow
                  key={banner.id}
                  banner={banner}
                  index={idx}
                  onToggle={() => toggleMutation.mutate(banner.id)}
                  onEdit={() => startEdit(banner)}
                  onDelete={() => setDeleteTarget(banner)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* 등록·수정 통합 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--overlay-bg)]"
            onClick={closeModal}
          />
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] p-8 max-w-md w-full mx-6">
            <h2 className="text-sm tracking-wider text-[var(--text-primary)] mb-6">
              {pendingFile ? "배너 등록" : "배너 수정"}
            </h2>

            {/* 이미지 미리보기 */}
            <div className="w-full aspect-[16/9] bg-[var(--section-bg)] mb-5 overflow-hidden">
              <img
                src={pendingPreviewUrl ?? editTarget?.imageUrl ?? ""}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>

            {/* 제목 입력 */}
            <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
              제목 (메인 화면에 큰 글씨로 표시)
            </label>
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              maxLength={TITLE_MAX}
              placeholder="예: Find Your Style"
              className="w-full px-3 py-2.5 mb-2 bg-[var(--input-bg)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-secondary)]"
            />
            <p className="text-[10px] text-[var(--text-dim)] mb-4">
              {titleInput.length} / {TITLE_MAX}
            </p>

            {error && <p className="text-xs text-red-600 mb-4">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={closeModal}
                disabled={uploading || updateMutation.isPending}
                className="flex-1 py-2.5 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors disabled:opacity-40"
              >
                취소
              </button>
              <button
                onClick={pendingFile ? handleCreateSubmit : handleEditSubmit}
                disabled={uploading || updateMutation.isPending}
                className="flex-1 py-2.5 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-40"
              >
                {pendingFile
                  ? uploading
                    ? "업로드 중..."
                    : "등록"
                  : updateMutation.isPending
                    ? "저장 중..."
                    : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW ARRIVALS 큐레이션 섹션 */}
      <NewArrivalsSection />

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
                className="flex-1 py-3 text-sm tracking-wider bg-red-600 text-white hover:bg-red-700 transition-colors"
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

function SortableBannerRow({
  banner,
  index,
  onToggle,
  onEdit,
  onDelete,
}: {
  banner: Banner;
  index: number;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: banner.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : "auto",
    opacity: isDragging ? 0.85 : 1,
    boxShadow: isDragging ? "0 12px 28px rgba(0,0,0,0.18)" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 bg-[var(--card-bg)] border border-[var(--border-color)] p-4"
    >
      <span className="text-lg font-light text-[var(--text-muted)] w-8 text-center flex-shrink-0">
        {index + 1}
      </span>

      <div className="w-[200px] h-[100px] bg-[var(--section-bg)] flex-shrink-0 overflow-hidden">
        <img
          src={banner.imageUrl}
          alt={`배너 ${index + 1}`}
          className="w-full h-full object-cover pointer-events-none"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--text-primary)] truncate mb-1">
          {banner.title || (
            <span className="text-[var(--text-dim)] italic">(제목 없음)</span>
          )}
        </p>
        <p className="text-xs text-[var(--text-muted)] truncate mb-1">
          {banner.imageUrl}
        </p>
        <p className="text-xs text-[var(--text-dim)]">
          {new Date(banner.createdAt).toLocaleDateString("ko-KR")}
        </p>
      </div>

      <button
        onClick={onToggle}
        className={`flex-shrink-0 w-12 h-6 rounded-full relative transition-colors ${
          banner.active ? "bg-[var(--accent)]" : "bg-[var(--border-color)]"
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

      <button
        onClick={onEdit}
        className="flex-shrink-0 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        <Pencil className="w-4 h-4" />
      </button>

      <button
        onClick={onDelete}
        className="flex-shrink-0 p-2 text-[var(--text-muted)] hover:text-red-600 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex-shrink-0 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-grab active:cursor-grabbing touch-none"
        aria-label="드래그해서 순서 변경"
        title="드래그해서 순서 변경"
      >
        <Menu className="w-5 h-5" />
      </button>
    </div>
  );
}
