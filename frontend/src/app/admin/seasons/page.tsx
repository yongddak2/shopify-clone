"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Menu, Trash2, Pencil, Check, X, Images } from "lucide-react";
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
import {
  getAdminSeasons,
  createSeason,
  updateSeasonName,
  toggleSeasonActive,
  reorderSeasons,
  deleteSeason,
} from "@/lib/admin";
import { invalidateSeasonRelated } from "@/lib/queryInvalidator";
import type { SeasonSummary } from "@/types";

const NAME_REGEX = /^[A-Za-z0-9 /]+$/;

export default function AdminSeasonsPage() {
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SeasonSummary | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const { data: seasons = [], isLoading } = useQuery({
    queryKey: ["admin", "seasons"],
    queryFn: getAdminSeasons,
  });

  const serverSorted = useMemo(
    () => [...seasons].sort((a, b) => a.sortOrder - b.sortOrder),
    [seasons]
  );
  const [localOrder, setLocalOrder] = useState<SeasonSummary[] | null>(null);
  const sorted = localOrder ?? serverSorted;
  useEffect(() => setLocalOrder(null), [serverSorted]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const createMutation = useMutation({
    mutationFn: (name: string) => createSeason(name),
    onSuccess: () => {
      setNewName("");
      setError("");
      invalidateSeasonRelated(qc);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(msg ?? "시즌 등록에 실패했습니다.");
    },
  });

  const renameMutation = useMutation({
    mutationFn: (vars: { id: number; name: string }) =>
      updateSeasonName(vars.id, vars.name),
    onSuccess: () => {
      setEditingId(null);
      setError("");
      invalidateSeasonRelated(qc);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(msg ?? "이름 변경에 실패했습니다.");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => toggleSeasonActive(id),
    onSuccess: () => invalidateSeasonRelated(qc),
  });

  const orderMutation = useMutation({
    mutationFn: (items: { id: number; sortOrder: number }[]) => reorderSeasons(items),
    onSuccess: () => invalidateSeasonRelated(qc),
    onError: () => {
      setLocalOrder(null);
      setError("정렬 저장에 실패했습니다.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSeason(id),
    onSuccess: () => {
      setDeleteTarget(null);
      invalidateSeasonRelated(qc);
    },
  });

  const handleCreate = () => {
    setError("");
    const name = newName.trim();
    if (!name) {
      setError("시즌 이름을 입력해주세요.");
      return;
    }
    if (!NAME_REGEX.test(name)) {
      setError("영문, 숫자, 공백만 사용할 수 있습니다.");
      return;
    }
    createMutation.mutate(name);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = sorted.findIndex((s) => s.id === active.id);
    const newIdx = sorted.findIndex((s) => s.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(sorted, oldIdx, newIdx);
    setLocalOrder(next);
    orderMutation.mutate(next.map((s, i) => ({ id: s.id, sortOrder: i + 1 })));
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-light tracking-[0.15em] text-[var(--text-primary)] mb-8">
        시즌관리
      </h1>

      <div className="max-w-3xl space-y-8">
        {/* 신규 등록 */}
        <section className="border border-[var(--border-color)] p-6">
          <h2 className="text-xs tracking-wider text-[var(--text-muted)] mb-3">
            새 시즌 추가
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="예: 26 SPRING"
              maxLength={50}
              className="flex-1 px-3 py-2 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)]"
            />
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="px-5 text-sm tracking-wider bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? "추가 중..." : "추가"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-[var(--text-dim)]">
            영문·숫자·공백만 사용 가능. URL은 입력한 이름에서 자동 생성됩니다.
          </p>
        </section>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        {/* 시즌 목록 */}
        <section>
          <h2 className="text-xs tracking-wider text-[var(--text-muted)] mb-3">
            등록된 시즌 ({serverSorted.length})
          </h2>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-[var(--skeleton)] animate-pulse" />
              ))}
            </div>
          ) : serverSorted.length === 0 ? (
            <div className="border border-[var(--border-color)] py-16 text-center text-sm text-[var(--text-muted)]">
              아직 등록된 시즌이 없습니다.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sorted.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2">
                  {sorted.map((season) => (
                    <SeasonRow
                      key={season.id}
                      season={season}
                      isEditing={editingId === season.id}
                      editName={editName}
                      onStartEdit={() => {
                        setEditingId(season.id);
                        setEditName(season.name);
                        setError("");
                      }}
                      onChangeEdit={setEditName}
                      onCancelEdit={() => setEditingId(null)}
                      onSubmitEdit={() => {
                        const trimmed = editName.trim();
                        if (!trimmed) return;
                        if (!NAME_REGEX.test(trimmed)) {
                          setError("영문, 숫자, 공백만 사용할 수 있습니다.");
                          return;
                        }
                        renameMutation.mutate({ id: season.id, name: trimmed });
                      }}
                      onToggle={() => toggleMutation.mutate(season.id)}
                      onDelete={() => setDeleteTarget(season)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </section>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--overlay-bg)]"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-sm w-full mx-6 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              <strong>{deleteTarget.name}</strong> 시즌을 삭제하시겠습니까?
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-8">
              사진 {deleteTarget.imageCount}장도 함께 삭제됩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 text-sm tracking-wider border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
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

function SeasonRow({
  season,
  isEditing,
  editName,
  onStartEdit,
  onChangeEdit,
  onCancelEdit,
  onSubmitEdit,
  onToggle,
  onDelete,
}: {
  season: SeasonSummary;
  isEditing: boolean;
  editName: string;
  onStartEdit: () => void;
  onChangeEdit: (v: string) => void;
  onCancelEdit: () => void;
  onSubmitEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: season.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-3"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        aria-label="드래그하여 순서 변경"
      >
        <Menu className="w-4 h-4" strokeWidth={1.5} />
      </button>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => onChangeEdit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmitEdit();
                if (e.key === "Escape") onCancelEdit();
              }}
              autoFocus
              maxLength={50}
              className="flex-1 px-2 py-1 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)]"
            />
            <button
              onClick={onSubmitEdit}
              className="p-1 text-[var(--text-primary)] hover:bg-[var(--border-light)]"
              aria-label="저장"
            >
              <Check className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button
              onClick={onCancelEdit}
              className="p-1 text-[var(--text-muted)] hover:bg-[var(--border-light)]"
              aria-label="취소"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-primary)] font-medium">
              {season.name}
            </span>
            <span className="text-[11px] text-[var(--text-dim)] tracking-wider">
              /pntk/{season.slug}
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              사진 {season.imageCount}장
            </span>
          </div>
        )}
      </div>

      {!isEditing && (
        <>
          <button
            onClick={onToggle}
            className={`text-[10px] tracking-wider px-2 py-1 border transition-colors ${
              season.isActive
                ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--btn-primary-text)]"
                : "border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {season.isActive ? "노출 ON" : "노출 OFF"}
          </button>
          <Link
            href={`/admin/seasons/${season.id}/photos`}
            className="flex items-center gap-1 px-2 py-1 text-[11px] tracking-wider border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Images className="w-3.5 h-3.5" strokeWidth={1.5} />
            사진 관리
          </Link>
          <button
            onClick={onStartEdit}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label="이름 수정"
          >
            <Pencil className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-[var(--text-muted)] hover:text-red-400"
            aria-label="삭제"
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </>
      )}
    </li>
  );
}
