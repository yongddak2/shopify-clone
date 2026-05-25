"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, MessageSquareReply, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import {
  answerQna,
  createAnswerTemplate,
  deleteAdminQna,
  deleteAnswerTemplate,
  deleteQnaAnswer,
  getAdminQna,
  getAdminQnas,
  getAnswerTemplates,
  updateAnswerTemplate,
} from "@/lib/admin";
import type { AnswerTemplate, QnaListItem, SupportCategory } from "@/types";

const ANSWERED_TABS: { value: "ALL" | "PENDING" | "DONE"; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "PENDING", label: "미답변" },
  { value: "DONE", label: "답변완료" },
];

const CATEGORY_OPTIONS: { value: "" | SupportCategory; label: string }[] = [
  { value: "", label: "전체 카테고리" },
  { value: "PRODUCT", label: "상품" },
  { value: "DELIVERY", label: "배송" },
  { value: "EXCHANGE", label: "교환/반품" },
  { value: "PAYMENT", label: "결제" },
  { value: "MEMBER", label: "회원" },
  { value: "ETC", label: "기타" },
];

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("ko-KR");
}

function AdminQnasContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [category, setCategory] = useState<"" | SupportCategory>("");
  const [answeredTab, setAnsweredTab] = useState<"ALL" | "PENDING" | "DONE">(() => {
    const v = searchParams.get("answered");
    if (v === "true") return "DONE";
    if (v === "false") return "PENDING";
    return "ALL";
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QnaListItem | null>(null);
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    setPage(0);
  }, [debouncedKeyword, category, answeredTab]);

  const answeredParam =
    answeredTab === "ALL" ? undefined : answeredTab === "DONE";

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "qnas", page, debouncedKeyword, category, answeredTab],
    queryFn: () =>
      getAdminQnas(page, debouncedKeyword, category || undefined, answeredParam),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "qnas"] });
    queryClient.invalidateQueries({ queryKey: ["qnas"] });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAdminQna(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
    onError: () => {
      setDeleteTarget(null);
      setError("삭제에 실패했습니다.");
    },
  });

  const qnas = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-xl font-light tracking-[0.15em] text-[var(--text-primary)]">
          Q&amp;A
        </h1>
        <button
          onClick={() => setTemplateManagerOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors"
        >
          <MessageSquareReply className="w-4 h-4" strokeWidth={1.5} />
          자주 쓰는 답변 관리
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative max-w-md flex-1 min-w-[240px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="제목 검색"
            className="w-full pl-10 pr-3 py-2 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--text-muted)]"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as "" | SupportCategory)}
          className="px-3 py-2 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)]"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {ANSWERED_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setAnsweredTab(tab.value)}
            className={`px-3 py-1.5 text-xs tracking-widest border transition-colors ${
              answeredTab === tab.value
                ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border-[var(--btn-primary-bg)]"
                : "border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-[var(--skeleton)] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] text-xs tracking-wider">
                <th className="py-3 px-3 text-left w-[60px]">ID</th>
                <th className="py-3 px-3 text-left w-[90px]">카테고리</th>
                <th className="py-3 px-3 text-left">제목</th>
                <th className="py-3 px-3 text-center w-[80px]">상태</th>
                <th className="py-3 px-3 text-left w-[120px]">작성자</th>
                <th className="py-3 px-3 text-left w-[110px]">등록일</th>
                <th className="py-3 px-3 text-center w-[80px]">관리</th>
              </tr>
            </thead>
            <tbody>
              {qnas.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--text-muted)] text-xs">
                    문의가 없습니다.
                  </td>
                </tr>
              )}
              {qnas.map((q) => (
                <tr
                  key={q.id}
                  className="border-b border-[var(--border-color)] hover:bg-[var(--card-bg)] transition-colors"
                >
                  <td className="py-3 px-3 text-[var(--text-muted)]">{q.id}</td>
                  <td className="py-3 px-3 text-[var(--text-muted)] text-xs tracking-wider">
                    {q.categoryLabel}
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => setSelectedId(q.id)}
                      className="flex items-center gap-2 text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline"
                    >
                      {q.secret && (
                        <Lock className="w-3.5 h-3.5 text-[var(--text-muted)]" strokeWidth={1.5} />
                      )}
                      <span>{q.title}</span>
                    </button>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {q.answered ? (
                      <span className="inline-block px-2 py-0.5 text-[10px] tracking-wider bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]">
                        답변완료
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 text-[10px] tracking-wider bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]">
                        미답변
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-[var(--text-muted)] text-xs">{q.authorMasked}</td>
                  <td className="py-3 px-3 text-[var(--text-muted)]">{formatDate(q.createdAt)}</td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => {
                        setDeleteTarget(q);
                        setError("");
                      }}
                      className="text-xs text-[var(--badge-red-text)] hover:underline"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-8 h-8 text-xs transition-colors ${
                page === i
                  ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {selectedId && (
        <QnaAnswerModal
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onAnswered={invalidate}
        />
      )}

      {templateManagerOpen && (
        <TemplateManagerModal onClose={() => setTemplateManagerOpen(false)} />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--overlay-bg)]"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-sm w-full mx-6 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              문의를 삭제하시겠습니까?
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-8">
              {deleteTarget.title}
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

export default function AdminQnasPage() {
  return (
    <Suspense fallback={<div className="p-8" />}>
      <AdminQnasContent />
    </Suspense>
  );
}

function QnaAnswerModal({
  id,
  onClose,
  onAnswered,
}: {
  id: number;
  onClose: () => void;
  onAnswered: () => void;
}) {
  const queryClient = useQueryClient();
  const [answer, setAnswer] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState("");

  const { data: qna, isLoading } = useQuery({
    queryKey: ["admin", "qna", id],
    queryFn: () => getAdminQna(id),
  });

  useEffect(() => {
    if (qna?.answer) setAnswer(qna.answer);
  }, [qna?.answer]);

  const answerMutation = useMutation({
    mutationFn: () => answerQna(id, { answer }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "qna", id] });
      onAnswered();
      onClose();
    },
    onError: () => setError("답변 등록에 실패했습니다."),
  });

  const deleteAnswerMutation = useMutation({
    mutationFn: () => deleteQnaAnswer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "qna", id] });
      onAnswered();
      onClose();
    },
    onError: () => setError("답변 삭제에 실패했습니다."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!answer.trim()) {
      setError("답변을 입력해주세요.");
      return;
    }
    answerMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-[var(--overlay-bg)]" onClick={onClose} />
      <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] max-w-2xl w-full mx-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--border-color)]">
          <h2 className="text-base tracking-wider text-[var(--text-primary)]">문의 답변</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {isLoading ? (
          <div className="px-8 py-10 space-y-3">
            <div className="h-6 bg-[var(--skeleton)] animate-pulse" />
            <div className="h-32 bg-[var(--skeleton)] animate-pulse" />
          </div>
        ) : qna ? (
          <div className="px-8 py-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2 text-xs">
                <span className="px-2 py-0.5 bg-[var(--section-bg)] text-[var(--text-muted)]">
                  {qna.categoryLabel}
                </span>
                {qna.secret && (
                  <span className="px-2 py-0.5 bg-[var(--section-bg)] text-[var(--text-muted)]">
                    비밀글
                  </span>
                )}
                <span className="text-[var(--text-muted)]">
                  {qna.authorName ?? "익명"} · {new Date(qna.createdAt).toLocaleString("ko-KR")}
                </span>
              </div>
              <h3 className="text-base text-[var(--text-primary)] mb-3">{qna.title}</h3>
              <div className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap bg-[var(--section-bg)] px-4 py-3 mb-4">
                {qna.content}
              </div>

              {qna.imageUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {qna.imageUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt={`첨부${i + 1}`}
                        className="w-24 h-24 object-cover border border-[var(--border-color)]"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="flex items-center justify-between mb-2 gap-3">
                <label className="block text-xs tracking-wider text-[var(--text-muted)]">
                  답변 {qna.answered && "(수정 시 알림 이메일 미발송)"}
                </label>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors"
                >
                  <MessageSquareReply className="w-3 h-3" strokeWidth={1.5} />
                  자주 쓰는 답변
                </button>
              </div>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={8}
                placeholder="답변 내용을 입력해주세요."
                className="w-full px-3 py-2 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)] resize-y mb-3"
              />
              {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
              <div className="flex items-center gap-3 justify-end">
                {qna.answered && (
                  <button
                    type="button"
                    onClick={() => deleteAnswerMutation.mutate()}
                    disabled={deleteAnswerMutation.isPending}
                    className="px-4 py-2 text-sm text-red-400 hover:underline"
                  >
                    답변 삭제
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={answerMutation.isPending}
                  className="px-4 py-2 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-50"
                >
                  {answerMutation.isPending
                    ? "저장 중..."
                    : qna.answered
                      ? "답변 수정"
                      : "답변 등록"}
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>

      {pickerOpen && (
        <TemplatePickerModal
          onClose={() => setPickerOpen(false)}
          onPick={(content) => {
            setAnswer(content);
            setPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}

function TemplatePickerModal({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (content: string) => void;
}) {
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["admin", "answer-templates"],
    queryFn: getAnswerTemplates,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <div className="absolute inset-0 bg-[var(--overlay-bg)]" onClick={onClose} />
      <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] max-w-lg w-full mx-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
          <h2 className="text-sm tracking-wider text-[var(--text-primary)]">자주 쓰는 답변 선택</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-[var(--skeleton)] animate-pulse" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="py-16 px-6 text-center text-[var(--text-muted)] text-sm">
            등록된 템플릿이 없습니다.<br />
            <span className="text-xs">상단의 &quot;자주 쓰는 답변 관리&quot;에서 등록해주세요.</span>
          </div>
        ) : (
          <ul>
            {templates.map((t) => (
              <li key={t.id} className="border-b border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => onPick(t.content)}
                  className="w-full text-left px-6 py-4 hover:bg-[var(--section-bg)] transition-colors"
                >
                  <p className="text-sm text-[var(--text-primary)] mb-1">{t.title}</p>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 whitespace-pre-wrap">
                    {t.content}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface TemplateEditorState {
  mode: "create" | "edit";
  template: AnswerTemplate | null;
}

function TemplateManagerModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [editor, setEditor] = useState<TemplateEditorState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AnswerTemplate | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["admin", "answer-templates"],
    queryFn: getAnswerTemplates,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "answer-templates"] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAnswerTemplate(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
    onError: () => {
      setDeleteTarget(null);
      setError("삭제에 실패했습니다.");
    },
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-[var(--overlay-bg)]" onClick={onClose} />
      <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] max-w-2xl w-full mx-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
          <h2 className="text-base tracking-wider text-[var(--text-primary)]">자주 쓰는 답변 관리</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-[var(--text-muted)]">
              저장해둔 답변은 문의 답변 시 한 번에 불러올 수 있습니다.
            </p>
            <button
              type="button"
              onClick={() => setEditor({ mode: "create", template: null })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors"
            >
              <Plus className="w-3 h-3" strokeWidth={2} />
              새 답변
            </button>
          </div>

          {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-[var(--skeleton)] animate-pulse" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="py-16 text-center text-[var(--text-muted)] text-sm">
              등록된 템플릿이 없습니다.
            </div>
          ) : (
            <ul className="border-t border-[var(--border-color)]">
              {templates.map((t) => {
                const expanded = expandedId === t.id;
                return (
                  <li key={t.id} className="border-b border-[var(--border-color)]">
                    <div className="flex items-center gap-3 py-3">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : t.id)}
                        className="flex-1 text-left text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        {t.title}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditor({ mode: "edit", template: t })}
                        className="text-[var(--badge-blue-text)] hover:opacity-80"
                      >
                        <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteTarget(t);
                          setError("");
                        }}
                        className="text-[var(--badge-red-text)] hover:opacity-80"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                    {expanded && (
                      <div className="px-3 pb-4 text-sm text-[var(--text-secondary)] whitespace-pre-wrap bg-[var(--section-bg)]">
                        {t.content}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {editor && (
        <TemplateEditorModal
          state={editor}
          onClose={() => setEditor(null)}
          onSaved={() => {
            invalidate();
            setEditor(null);
          }}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--overlay-bg)]"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-sm w-full mx-6 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              템플릿을 삭제하시겠습니까?
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-8">{deleteTarget.title}</p>
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

function TemplateEditorModal({
  state,
  onClose,
  onSaved,
}: {
  state: TemplateEditorState;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = state.mode === "edit" && state.template;
  const [title, setTitle] = useState(state.template?.title ?? "");
  const [content, setContent] = useState(state.template?.content ?? "");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { title, content };
      if (isEdit && state.template) {
        return updateAnswerTemplate(state.template.id, payload);
      }
      return createAnswerTemplate(payload);
    },
    onSuccess: onSaved,
    onError: () => setError("저장에 실패했습니다."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim() || !content.trim()) {
      setError("이름과 내용을 모두 입력해주세요.");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <div className="absolute inset-0 bg-[var(--overlay-bg)]" onClick={onClose} />
      <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-xl w-full mx-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base tracking-wider text-[var(--text-primary)]">
            {isEdit ? "템플릿 수정" : "템플릿 등록"}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
              템플릿 이름
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="예: 배송 지연 안내"
              className="w-full px-3 py-2 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)]"
            />
          </div>

          <div>
            <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
              답변 내용
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
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
