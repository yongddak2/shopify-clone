"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { ChevronDown, Menu, Pencil, Trash2, X } from "lucide-react";
import {
  createFaq,
  deleteFaq,
  getAdminFaqs,
  reorderFaqs,
  updateFaq,
} from "@/lib/admin";
import type { Faq, SupportCategory } from "@/types";

const CATEGORY_OPTIONS: { value: SupportCategory; label: string }[] = [
  { value: "DELIVERY", label: "배송" },
  { value: "EXCHANGE", label: "교환/반품" },
  { value: "PAYMENT", label: "결제" },
  { value: "MEMBER", label: "회원" },
  { value: "PRODUCT", label: "상품" },
  { value: "ETC", label: "기타" },
];

const TABS: { value: SupportCategory | "ALL"; label: string }[] = [
  { value: "ALL", label: "ALL" },
  ...CATEGORY_OPTIONS,
];

interface EditorState {
  mode: "create" | "edit";
  faq: Faq | null;
}

function SortableFaqRow({
  faq,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  draggable,
}: {
  faq: Faq;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  draggable: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: faq.id, disabled: !draggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="border-b border-[var(--border-color)] bg-[var(--card-bg)]"
    >
      <div className="flex items-center gap-2 py-3 px-3">
        {draggable && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-grab active:cursor-grabbing"
            aria-label="순서 변경"
          >
            <Menu className="w-4 h-4" strokeWidth={1.5} />
          </button>
        )}
        <span className="inline-block w-16 text-[10px] tracking-wider text-[var(--text-muted)]">
          {faq.categoryLabel}
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 text-left text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          {faq.question}
        </button>
        <ChevronDown
          className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          strokeWidth={1.5}
        />
        <button
          type="button"
          onClick={onEdit}
          className="text-xs text-[var(--badge-blue-text)] hover:underline ml-2"
        >
          <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-[var(--badge-red-text)] hover:underline"
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      </div>
      {expanded && (
        <div className="px-3 pb-4 pl-[88px] text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
          {faq.answer}
        </div>
      )}
    </li>
  );
}

export default function AdminFaqsPage() {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<SupportCategory | "ALL">("ALL");
  const [openId, setOpenId] = useState<number | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Faq | null>(null);
  const [localOrder, setLocalOrder] = useState<Faq[] | null>(null);
  const [error, setError] = useState("");

  const { data: serverFaqs = [], isLoading } = useQuery({
    queryKey: ["admin", "faqs"],
    queryFn: getAdminFaqs,
  });

  useEffect(() => {
    setLocalOrder(null);
  }, [serverFaqs]);

  const faqs = localOrder ?? serverFaqs;

  const filtered = useMemo(() => {
    if (selectedTab === "ALL") return faqs;
    return faqs.filter((f) => f.category === selectedTab);
  }, [faqs, selectedTab]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "faqs"] });
    queryClient.invalidateQueries({ queryKey: ["faqs"] });
  };

  const reorderMutation = useMutation({
    mutationFn: (items: { id: number; sortOrder: number }[]) =>
      reorderFaqs({ items }),
    onSuccess: invalidate,
    onError: () => {
      setError("순서 변경에 실패했습니다.");
      setLocalOrder(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteFaq(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
    onError: () => {
      setDeleteTarget(null);
      setError("삭제에 실패했습니다.");
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (selectedTab === "ALL") return; // ALL에서는 정렬 안 함

    const oldIdx = filtered.findIndex((f) => f.id === active.id);
    const newIdx = filtered.findIndex((f) => f.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;

    const movedCategoryList = arrayMove(filtered, oldIdx, newIdx);

    // 전체 faqs에서 해당 카테고리만 새 순서로 교체
    const nextAll: Faq[] = [];
    let cursor = 0;
    for (const faq of faqs) {
      if (faq.category === selectedTab) {
        nextAll.push(movedCategoryList[cursor++]);
      } else {
        nextAll.push(faq);
      }
    }
    setLocalOrder(nextAll);

    const items = movedCategoryList.map((f, idx) => ({
      id: f.id,
      sortOrder: idx,
    }));
    reorderMutation.mutate(items);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-xl font-light tracking-[0.15em] text-[var(--text-primary)]">
          FAQ
        </h1>
        <button
          onClick={() => setEditor({ mode: "create", faq: null })}
          className="px-4 py-2 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors"
        >
          FAQ 등록
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setSelectedTab(tab.value);
              setOpenId(null);
            }}
            className={`px-3 py-1.5 text-xs tracking-widest border transition-colors ${
              selectedTab === tab.value
                ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border-[var(--btn-primary-bg)]"
                : "border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {selectedTab === "ALL" && (
        <p className="text-xs text-[var(--text-muted)] mb-3">
          순서 변경은 각 카테고리 탭을 선택했을 때만 가능합니다.
        </p>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-[var(--skeleton)] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-muted)] text-sm">
          등록된 FAQ가 없습니다.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filtered.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="border-t border-[var(--border-color)]">
              {filtered.map((faq) => (
                <SortableFaqRow
                  key={faq.id}
                  faq={faq}
                  expanded={openId === faq.id}
                  onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
                  onEdit={() => setEditor({ mode: "edit", faq })}
                  onDelete={() => {
                    setDeleteTarget(faq);
                    setError("");
                  }}
                  draggable={selectedTab !== "ALL"}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {editor && (
        <FaqEditorModal
          state={editor}
          onClose={() => setEditor(null)}
          onSaved={() => {
            invalidate();
            setEditor(null);
          }}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--overlay-bg)]"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-sm w-full mx-6 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              FAQ를 삭제하시겠습니까?
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-8">
              {deleteTarget.question}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-3 text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
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

function FaqEditorModal({
  state,
  onClose,
  onSaved,
}: {
  state: EditorState;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = state.mode === "edit" && state.faq;
  const [category, setCategory] = useState<SupportCategory>(
    state.faq?.category ?? "DELIVERY"
  );
  const [question, setQuestion] = useState(state.faq?.question ?? "");
  const [answer, setAnswer] = useState(state.faq?.answer ?? "");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { category, question, answer };
      if (isEdit && state.faq) {
        return updateFaq(state.faq.id, payload);
      }
      return createFaq(payload);
    },
    onSuccess: onSaved,
    onError: () => setError("저장에 실패했습니다."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!question.trim() || !answer.trim()) {
      setError("질문과 답변을 모두 입력해주세요.");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-[var(--overlay-bg)]" onClick={onClose} />
      <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-xl w-full mx-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base tracking-wider text-[var(--text-primary)]">
            {isEdit ? "FAQ 수정" : "FAQ 등록"}
          </h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
              카테고리
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SupportCategory)}
              className="w-full px-3 py-2 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)]"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
              질문
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={300}
              className="w-full px-3 py-2 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)]"
            />
          </div>

          <div>
            <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
              답변
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)] resize-y"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2.5 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
