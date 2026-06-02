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
  getAdminProducts,
  type BannerLinkInput,
} from "@/lib/admin";
import { Menu, Trash2, Pencil, X, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import {
  invalidateBannerRelated,
  invalidateMainPageConfigRelated,
} from "@/lib/queryInvalidator";
import type { AdminBanner, LinkedProduct, AdminProduct } from "@/types";
import NewArrivalsSection from "./NewArrivalsSection";
import AboutImageSection from "./AboutImageSection";
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
const LINK_URL_MAX = 500;

type LinkMode = "none" | "product" | "url";

// 모달에서 선택한 상품 메타 (검색 결과 → 모달 → 저장 전 임시 보관용).
// 저장 후 백엔드 응답 LinkedProduct와 동일 구조라 그대로 재사용.
type SelectedProduct = LinkedProduct;

function isValidLinkUrl(url: string) {
  return (
    url.startsWith("/") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  );
}

function productMetaFromAdmin(p: AdminProduct): SelectedProduct {
  return {
    id: p.id,
    name: p.name,
    thumbnailUrl: p.thumbnailUrl,
    status: p.status as SelectedProduct["status"],
    deleted: p.deletedAt != null,
  };
}

function isProductInvalid(p: SelectedProduct | null) {
  if (!p) return false;
  return p.deleted || p.status !== "ACTIVE";
}

export default function AdminBannersPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminBanner | null>(null);

  // 등록 모달용 임시 상태 (파일 보관 + 미리보기 URL)
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);

  // 수정 모달용
  const [editTarget, setEditTarget] = useState<AdminBanner | null>(null);

  // 모달 공통 입력
  const [titleInput, setTitleInput] = useState("");
  const [linkMode, setLinkMode] = useState<LinkMode>("none");
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [linkUrlInput, setLinkUrlInput] = useState("");

  // 상품 검색 모달
  const [productSearchOpen, setProductSearchOpen] = useState(false);

  const isModalOpen = pendingFile !== null || editTarget !== null;

  const { data, isLoading, error: bannersError } = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: getBanners,
  });

  const banners = data?.data ?? [];
  const serverSorted = useMemo(
    () => [...banners].sort((a, b) => a.sortOrder - b.sortOrder),
    [banners]
  );
  const [localOrder, setLocalOrder] = useState<AdminBanner[] | null>(null);
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

  const extractErrorMessage = (err: unknown, fallback: string): string => {
    const maybe = err as { response?: { data?: { message?: string } } };
    return maybe?.response?.data?.message ?? fallback;
  };

  const createMutation = useMutation({
    mutationFn: ({
      imageUrl,
      title,
      link,
    }: {
      imageUrl: string;
      title: string;
      link: BannerLinkInput;
    }) => createBanner(imageUrl, banners.length + 1, title, link),
    onSuccess: () => {
      invalidateBannerRelated(queryClient);
      closeModal();
    },
    onError: (err) => setError(extractErrorMessage(err, "배너 추가에 실패했습니다.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      title,
      link,
    }: {
      id: number;
      title: string;
      link: BannerLinkInput;
    }) => updateBanner(id, title, link),
    onSuccess: () => {
      invalidateBannerRelated(queryClient);
      closeModal();
    },
    onError: (err) => setError(extractErrorMessage(err, "수정에 실패했습니다.")),
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

    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingFile(file);
    setPendingPreviewUrl(URL.createObjectURL(file));
    setTitleInput("");
    setLinkMode("none");
    setSelectedProduct(null);
    setLinkUrlInput("");
    setError("");
  };

  const startEdit = (banner: AdminBanner) => {
    setEditTarget(banner);
    setTitleInput(banner.title ?? "");
    if (banner.productId != null) {
      setLinkMode("product");
      setSelectedProduct(banner.linkedProduct);
      setLinkUrlInput("");
    } else if (banner.linkUrl != null && banner.linkUrl !== "") {
      setLinkMode("url");
      setSelectedProduct(null);
      setLinkUrlInput(banner.linkUrl);
    } else {
      setLinkMode("none");
      setSelectedProduct(null);
      setLinkUrlInput("");
    }
    setError("");
  };

  const closeModal = () => {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingFile(null);
    setPendingPreviewUrl(null);
    setEditTarget(null);
    setTitleInput("");
    setLinkMode("none");
    setSelectedProduct(null);
    setLinkUrlInput("");
    setError("");
  };

  // 라디오 모드 변경 시 잔존 값 초기화
  const handleModeChange = (mode: LinkMode) => {
    setLinkMode(mode);
    if (mode !== "product") setSelectedProduct(null);
    if (mode !== "url") setLinkUrlInput("");
  };

  // 모드 → 백엔드 페이로드
  const buildLinkPayload = (): BannerLinkInput | null => {
    if (linkMode === "none") {
      return { productId: null, linkUrl: null };
    }
    if (linkMode === "product") {
      if (!selectedProduct) {
        setError("연결할 상품을 선택해주세요.");
        return null;
      }
      return { productId: selectedProduct.id, linkUrl: null };
    }
    // url
    const trimmed = linkUrlInput.trim();
    if (!trimmed) {
      setError("URL을 입력해주세요.");
      return null;
    }
    if (!isValidLinkUrl(trimmed)) {
      setError("URL은 / 또는 http(s)://로 시작해야 합니다.");
      return null;
    }
    return { productId: null, linkUrl: trimmed };
  };

  const handleCreateSubmit = async () => {
    if (!pendingFile) return;
    const trimmed = titleInput.trim();
    if (!trimmed) {
      setError("제목을 입력해주세요.");
      return;
    }
    const link = buildLinkPayload();
    if (!link) return;

    setUploading(true);
    let url: string;
    try {
      url = await uploadBannerImage(pendingFile);
    } catch {
      setError("이미지 업로드에 실패했습니다.");
      setUploading(false);
      return;
    }
    try {
      await createMutation.mutateAsync({ imageUrl: url, title: trimmed, link });
    } catch {
      // onError에서 setError 처리됨
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
    const link = buildLinkPayload();
    if (!link) return;
    updateMutation.mutate({ id: editTarget.id, title: trimmed, link });
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

      {/* ABOUT 페이지 이미지 카드 */}
      <AboutImageSection />

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
      {bannersError && (
        <p className="text-sm text-red-600 mb-4">
          배너 목록 로드 실패: {(bannersError as Error).message}
        </p>
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
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] p-8 max-w-md w-full mx-6 max-h-[90vh] overflow-y-auto">
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
            <p className="text-[10px] text-[var(--text-dim)] mb-5">
              {titleInput.length} / {TITLE_MAX}
            </p>

            {/* 링크 설정 — 라디오 3분기 */}
            <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
              클릭 시 이동
            </label>
            <div className="flex gap-2 mb-4">
              {([
                { value: "none", label: "연결 없음" },
                { value: "product", label: "상품 연결" },
                { value: "url", label: "URL 직접 입력" },
              ] as { value: LinkMode; label: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleModeChange(opt.value)}
                  className={`flex-1 py-2 text-xs border transition-colors ${
                    linkMode === opt.value
                      ? "bg-[var(--text-primary)] text-[var(--btn-primary-text)] border-[var(--text-primary)]"
                      : "border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--text-muted)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* 상품 연결 */}
            {linkMode === "product" && (
              <div className="mb-5">
                {selectedProduct ? (
                  <div
                    className={`flex items-center gap-3 p-3 border ${
                      isProductInvalid(selectedProduct)
                        ? "border-red-400 bg-red-50"
                        : "border-[var(--border-color)] bg-[var(--input-bg)]"
                    }`}
                  >
                    <div className="w-14 h-14 bg-[var(--section-bg)] flex-shrink-0 overflow-hidden">
                      {selectedProduct.thumbnailUrl ? (
                        <img
                          src={selectedProduct.thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--text-primary)] truncate">
                        {selectedProduct.name}
                      </p>
                      {isProductInvalid(selectedProduct) && (
                        <p className="text-[10px] text-red-600 flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3 h-3" />
                          {selectedProduct.deleted
                            ? "삭제된 상품"
                            : selectedProduct.status === "INACTIVE"
                              ? "비활성 상품"
                              : "품절 상품"}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setProductSearchOpen(true)}
                      className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] underline flex-shrink-0"
                    >
                      변경
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setProductSearchOpen(true)}
                    className="w-full py-3 text-xs border border-dashed border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors"
                  >
                    + 상품 선택
                  </button>
                )}
              </div>
            )}

            {/* URL 입력 */}
            {linkMode === "url" && (
              <div className="mb-5">
                <input
                  type="text"
                  value={linkUrlInput}
                  onChange={(e) => setLinkUrlInput(e.target.value)}
                  maxLength={LINK_URL_MAX}
                  placeholder="/pntk/season-name 또는 https://..."
                  className="w-full px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-secondary)]"
                />
                <p className="text-[10px] text-[var(--text-dim)] mt-1">
                  내부 경로(/로 시작) 또는 외부 URL(http/https)
                </p>
              </div>
            )}

            {/* 연결 없음 안내 */}
            {linkMode === "none" && (
              <p className="text-[11px] text-[var(--text-dim)] mb-5">
                연결이 없는 배너는 클릭해도 이동하지 않습니다.
              </p>
            )}

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

      {/* 상품 검색 모달 (배너 모달 위 z-index) */}
      {productSearchOpen && (
        <ProductSearchModal
          onSelect={(product) => {
            setSelectedProduct(product);
            setProductSearchOpen(false);
          }}
          onClose={() => setProductSearchOpen(false)}
        />
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
  banner: AdminBanner;
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

  const linkedProductInvalid = isProductInvalid(banner.linkedProduct);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 bg-[var(--card-bg)] border border-[var(--border-color)] p-4"
    >
      <span className="text-lg font-light text-[var(--text-muted)] w-8 text-center flex-shrink-0">
        {index + 1}
      </span>

      <div className="w-[160px] h-[90px] bg-[var(--section-bg)] flex-shrink-0 overflow-hidden">
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
        {/* 연결 정보 */}
        {banner.linkedProduct ? (
          <div
            className={`flex items-center gap-2 mb-1 ${
              linkedProductInvalid ? "text-red-600" : "text-[var(--text-muted)]"
            }`}
          >
            {linkedProductInvalid && <AlertTriangle className="w-3 h-3 flex-shrink-0" />}
            <span className="text-[11px] truncate">
              → {banner.linkedProduct.name}
              {linkedProductInvalid && (
                <span className="ml-1">
                  (
                  {banner.linkedProduct.deleted
                    ? "삭제됨"
                    : banner.linkedProduct.status === "INACTIVE"
                      ? "비활성"
                      : "품절"}
                  )
                </span>
              )}
            </span>
          </div>
        ) : banner.linkUrl ? (
          <p className="text-[11px] text-[var(--text-muted)] truncate mb-1">
            → {banner.linkUrl}
          </p>
        ) : (
          <p className="text-[11px] text-[var(--text-dim)] italic mb-1">
            연결 없음
          </p>
        )}
        <p className="text-[10px] text-[var(--text-dim)]">
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

function ProductSearchModal({
  onSelect,
  onClose,
}: {
  onSelect: (product: SelectedProduct) => void;
  onClose: () => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "productSearch", submittedKeyword, page],
    queryFn: () => getAdminProducts(page, submittedKeyword),
  });

  const items = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;

  const handleSearch = () => {
    setPage(0);
    setSubmittedKeyword(keyword.trim());
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <div className="absolute inset-0 bg-[var(--overlay-bg)]" onClick={onClose} />
      <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] w-full max-w-2xl mx-6 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
          <h3 className="text-sm tracking-wider text-[var(--text-primary)]">
            연결할 상품 선택
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-[var(--border-color)]">
          <div className="flex gap-2">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="상품명 검색"
              className="flex-1 px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-secondary)]"
            />
            <button
              onClick={handleSearch}
              className="px-5 py-2 text-xs bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors"
            >
              검색
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[88px] bg-[var(--skeleton)] animate-pulse"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-center py-10 text-sm text-[var(--text-muted)]">
              검색 결과가 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {items.map((p) => {
                const meta = productMetaFromAdmin(p);
                const invalid = isProductInvalid(meta);
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelect(meta)}
                    className="flex items-center gap-3 p-3 border border-[var(--border-color)] hover:border-[var(--text-muted)] transition-colors text-left"
                  >
                    <div className="w-14 h-14 bg-[var(--section-bg)] flex-shrink-0 overflow-hidden">
                      {p.thumbnailUrl ? (
                        <img
                          src={p.thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--text-primary)] truncate">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {p.basePrice.toLocaleString("ko-KR")}원
                      </p>
                      {invalid && (
                        <p className="text-[10px] text-red-600 flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3 h-3" />
                          {meta.deleted
                            ? "삭제됨"
                            : meta.status === "INACTIVE"
                              ? "비활성"
                              : "품절"}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 px-6 py-3 border-t border-[var(--border-color)]">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-[var(--text-muted)]">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
