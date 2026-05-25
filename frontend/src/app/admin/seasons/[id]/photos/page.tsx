"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2, Menu, Upload } from "lucide-react";
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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  getAdminSeasons,
  getSeasonImages,
  uploadSeasonImages,
  reorderSeasonImages,
  deleteSeasonImage,
} from "@/lib/admin";
import { invalidateSeasonRelated } from "@/lib/queryInvalidator";
import type { SeasonImage } from "@/types";

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file

export default function AdminSeasonPhotosPage() {
  const params = useParams<{ id: string }>();
  const seasonId = Number(params?.id);
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const { data: seasons = [] } = useQuery({
    queryKey: ["admin", "seasons"],
    queryFn: getAdminSeasons,
  });
  const season = seasons.find((s) => s.id === seasonId);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["admin", "season-images", seasonId],
    queryFn: () => getSeasonImages(seasonId),
    enabled: Number.isFinite(seasonId),
  });

  const serverSorted = useMemo(
    () => [...images].sort((a, b) => a.sortOrder - b.sortOrder),
    [images]
  );
  const [localOrder, setLocalOrder] = useState<SeasonImage[] | null>(null);
  const sorted = localOrder ?? serverSorted;
  useEffect(() => setLocalOrder(null), [serverSorted]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const orderMutation = useMutation({
    mutationFn: (items: { id: number; sortOrder: number }[]) =>
      reorderSeasonImages(seasonId, items),
    onSuccess: () => invalidateSeasonRelated(qc),
    onError: () => {
      setLocalOrder(null);
      setError("정렬 저장에 실패했습니다.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (imageId: number) => deleteSeasonImage(imageId),
    onSuccess: () => {
      setDeleteTargetId(null);
      invalidateSeasonRelated(qc);
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = sorted.findIndex((i) => i.id === active.id);
    const newIdx = sorted.findIndex((i) => i.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(sorted, oldIdx, newIdx);
    setLocalOrder(next);
    orderMutation.mutate(next.map((img, i) => ({ id: img.id, sortOrder: i + 1 })));
  };

  const handleFiles = async (filesIn: FileList | null) => {
    if (!filesIn || filesIn.length === 0) return;
    setError("");

    const files = Array.from(filesIn);
    for (const f of files) {
      const ext = f.name.split(".").pop()?.toLowerCase();
      if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
        setError(`허용되지 않는 파일 형식: ${f.name}`);
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        setError(`10MB 초과 파일: ${f.name}`);
        return;
      }
    }

    setUploading(true);
    try {
      await uploadSeasonImages(seasonId, files);
      invalidateSeasonRelated(qc);
    } catch {
      setError("업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-2">
        <Link
          href="/admin/seasons"
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          aria-label="시즌 목록"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </Link>
        <h1 className="text-xl font-light tracking-[0.15em] text-[var(--text-primary)]">
          {season ? season.name : "사진 관리"}
        </h1>
        {season && (
          <span className="text-[11px] text-[var(--text-dim)] tracking-wider">
            /pntk/{season.slug}
          </span>
        )}
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-8">
        시즌에 표시될 화보 사진을 업로드하고 순서를 정렬하세요.
      </p>

      <div className="max-w-6xl space-y-6">
        {/* 업로드 영역 */}
        <section className="border-2 border-dashed border-[var(--border-color)] py-10 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm tracking-wider bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" strokeWidth={1.5} />
            {uploading ? "업로드 중..." : "사진 업로드"}
          </button>
          <p className="mt-3 text-[11px] text-[var(--text-dim)]">
            JPG·PNG·WEBP 등 / 한 장당 최대 10MB
          </p>
        </section>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* 사진 그리드 */}
        <section>
          <h2 className="text-xs tracking-wider text-[var(--text-muted)] mb-3">
            업로드된 사진 ({serverSorted.length})
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-[var(--skeleton)] animate-pulse" />
              ))}
            </div>
          ) : serverSorted.length === 0 ? (
            <div className="border border-[var(--border-color)] py-16 text-center text-sm text-[var(--text-muted)]">
              아직 업로드된 사진이 없습니다.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sorted.map((i) => i.id)}
                strategy={rectSortingStrategy}
              >
                <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {sorted.map((img) => (
                    <PhotoCard
                      key={img.id}
                      image={img}
                      onDelete={() => setDeleteTargetId(img.id)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </section>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteTargetId !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--overlay-bg)]"
            onClick={() => setDeleteTargetId(null)}
          />
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-sm w-full mx-6 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-8">
              이 사진을 삭제하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-3 text-sm tracking-wider border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTargetId)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-3 text-sm tracking-wider bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-50"
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

function PhotoCard({
  image,
  onDelete,
}: {
  image: SeasonImage;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: image.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className="relative group aspect-[3/4] bg-[var(--card-bg)] border border-[var(--border-color)] overflow-hidden"
    >
      <img
        src={image.imageUrl}
        alt=""
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity flex items-start justify-between p-2">
        <button
          {...attributes}
          {...listeners}
          className="p-1.5 bg-white/90 text-[var(--text-primary)] cursor-grab active:cursor-grabbing"
          aria-label="드래그하여 순서 변경"
        >
          <Menu className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 bg-white/90 text-red-500 hover:bg-white"
          aria-label="삭제"
        >
          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
    </li>
  );
}
