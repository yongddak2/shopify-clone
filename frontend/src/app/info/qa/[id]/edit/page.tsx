"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getQnaDetail, updateQna } from "@/lib/qna";
import { useAuthStore } from "@/stores/authStore";
import type { SupportCategory } from "@/types";

const CATEGORIES: { value: SupportCategory; label: string }[] = [
  { value: "PRODUCT", label: "상품" },
  { value: "DELIVERY", label: "배송" },
  { value: "EXCHANGE", label: "교환/반품" },
  { value: "PAYMENT", label: "결제" },
  { value: "MEMBER", label: "회원" },
  { value: "ETC", label: "기타" },
];

export default function QnaEditPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const { user, isLoggedIn } = useAuthStore();

  const [category, setCategory] = useState<SupportCategory>("PRODUCT");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
  }, [isLoggedIn, router]);

  const { data: qna } = useQuery({
    queryKey: ["qna", id],
    queryFn: () => getQnaDetail(id),
    enabled: Number.isFinite(id),
  });

  useEffect(() => {
    if (qna) {
      setCategory(qna.category);
      setTitle(qna.title);
      setContent(qna.content);
      setIsSecret(qna.secret);
    }
  }, [qna]);

  // 본인 + 답변 전만 수정 가능
  useEffect(() => {
    if (!qna || !user) return;
    if (qna.authorId !== user.id || qna.answered) {
      router.replace(`/info/qa/${id}`);
    }
  }, [qna, user, id, router]);

  const mutation = useMutation({
    mutationFn: () => updateQna(id, { category, title, content, secret: isSecret }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qnas"] });
      queryClient.invalidateQueries({ queryKey: ["qna", id] });
      router.push(`/info/qa/${id}`);
    },
    onError: () => setError("수정에 실패했습니다."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="min-h-[calc(100vh-64px)] px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl tracking-[0.2em] font-light text-center mb-12 text-[var(--text-primary)]">
          문의 수정
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
              카테고리
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SupportCategory)}
              className="w-full px-3 py-2 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)]"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="w-full px-3 py-2 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)]"
            />
          </div>

          <div>
            <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
              내용
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)] resize-y"
            />
          </div>

          <div>
            <label className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
              <input
                type="checkbox"
                checked={isSecret}
                onChange={(e) => setIsSecret(e.target.checked)}
                className="w-4 h-4"
              />
              비밀글
            </label>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-6 py-2.5 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? "저장 중..." : "저장"}
            </button>
            <Link
              href={`/info/qa/${id}`}
              className="px-6 py-2.5 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
