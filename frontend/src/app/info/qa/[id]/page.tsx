"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { deleteQna, getQnaDetail } from "@/lib/qna";
import { useAuthStore } from "@/stores/authStore";

function formatDateTime(s: string) {
  return new Date(s).toLocaleString("ko-KR");
}

export default function QnaDetailPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const { user } = useAuthStore();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const { data: qna, isLoading, isError, error } = useQuery({
    queryKey: ["qna", id],
    queryFn: () => getQnaDetail(id),
    enabled: Number.isFinite(id),
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteQna(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qnas"] });
      router.push("/info/qa");
    },
    onError: () => {
      setDeleteModalOpen(false);
      setDeleteError("삭제에 실패했습니다.");
    },
  });

  const isOwner = qna && user && qna.authorId === user.id;
  const isAdmin = user?.role === "ADMIN";
  const canEdit = isOwner && !qna?.answered;
  const canDelete = isOwner || isAdmin;

  return (
    <div className="min-h-[calc(100vh-64px)] px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl tracking-[0.2em] font-light text-center mb-12 text-[var(--text-primary)]">
          Q&amp;A
        </h1>

        {isLoading && (
          <div className="space-y-4">
            <div className="h-8 bg-[var(--skeleton)] animate-pulse" />
            <div className="h-64 bg-[var(--skeleton)] animate-pulse" />
          </div>
        )}

        {isError && (
          <div className="text-center py-20 text-[var(--text-muted)] text-sm">
            {(error as { response?: { status?: number } })?.response?.status === 403
              ? "비밀글은 작성자와 관리자만 확인할 수 있습니다."
              : "문의를 불러올 수 없습니다."}
          </div>
        )}

        {qna && (
          <article>
            <header className="border-t border-b border-[var(--border-color)] py-6 mb-6">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="inline-block px-2 py-0.5 text-[10px] tracking-wider bg-[var(--card-bg)] text-[var(--text-muted)]">
                  {qna.categoryLabel}
                </span>
                {qna.secret && (
                  <Lock className="w-3.5 h-3.5 text-[var(--text-muted)]" strokeWidth={1.5} />
                )}
                {qna.answered && (
                  <span className="inline-block px-2 py-0.5 text-[10px] tracking-wider bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]">
                    답변완료
                  </span>
                )}
                <h2 className="text-lg text-[var(--text-primary)] flex-1 basis-full">{qna.title}</h2>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                {qna.authorName ?? "익명"} · {formatDateTime(qna.createdAt)}
              </p>
            </header>

            <div className="text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap mb-8">
              {qna.content}
            </div>

            {qna.imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-10">
                {qna.imageUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={url}
                      alt={`첨부${i + 1}`}
                      className="w-32 h-32 object-cover border border-[var(--border-color)]"
                    />
                  </a>
                ))}
              </div>
            )}

            {qna.answered && qna.answer && (
              <div className="border-t border-[var(--border-color)] pt-8 mb-10">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-block px-2 py-0.5 text-[10px] tracking-wider bg-[var(--text-primary)] text-[var(--btn-primary-text)]">
                    관리자 답변
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {qna.answeredAt && formatDateTime(qna.answeredAt)}
                  </span>
                </div>
                <div className="text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap bg-[var(--card-bg)] px-4 py-5">
                  {qna.answer}
                </div>
              </div>
            )}

            {(canEdit || canDelete) && (
              <div className="flex items-center gap-3 justify-end mb-6">
                {canEdit && (
                  <Link
                    href={`/info/qa/${id}/edit`}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] underline"
                  >
                    수정
                  </Link>
                )}
                {canDelete && (
                  <button
                    onClick={() => {
                      setDeleteError("");
                      setDeleteModalOpen(true);
                    }}
                    className="text-xs text-red-400 hover:text-red-500 underline"
                  >
                    삭제
                  </button>
                )}
              </div>
            )}

            {deleteError && <p className="text-sm text-red-400 mb-4">{deleteError}</p>}
          </article>
        )}

        <div className="mt-16 text-center">
          <Link
            href="/info/qa"
            className="inline-block text-xs tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            ← 목록으로
          </Link>
        </div>
      </div>

      {deleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--overlay-bg)]"
            onClick={() => setDeleteModalOpen(false)}
          />
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-sm w-full mx-6 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-8">
              문의를 삭제하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 py-3 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
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
