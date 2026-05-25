"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNotice } from "@/lib/admin";

export default function AdminNoticeNewPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => createNotice({ title, content, pinned: isPinned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "notices"] });
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      router.push("/admin/notices");
    },
    onError: () => setError("등록에 실패했습니다. 입력값을 확인해주세요."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 모두 입력해주세요.");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-light tracking-[0.15em] text-[var(--text-primary)] mb-8">
        공지 등록
      </h1>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
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
            placeholder="공지사항 제목"
          />
        </div>

        <div>
          <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
            내용
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            className="w-full px-3 py-2 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)] resize-y"
            placeholder="공지사항 본문"
          />
        </div>

        <div>
          <label className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4"
            />
            상단 고정
          </label>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-6 py-2.5 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? "등록 중..." : "등록"}
          </button>
          <Link
            href="/admin/notices"
            className="px-6 py-2.5 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}
