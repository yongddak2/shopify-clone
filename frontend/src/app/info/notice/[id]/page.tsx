"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Pin } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getNoticeDetail } from "@/lib/notice";

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("ko-KR");
}

export default function NoticeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);

  const { data: notice, isLoading, isError } = useQuery({
    queryKey: ["notice", id],
    queryFn: () => getNoticeDetail(id),
    enabled: Number.isFinite(id),
  });

  return (
    <div>
      <h1 className="text-2xl tracking-[0.2em] font-light text-[var(--text-primary)] mb-10">
        NOTICE
      </h1>

      {isLoading && (
        <div className="space-y-4">
          <div className="h-8 bg-[var(--skeleton)] animate-pulse" />
          <div className="h-64 bg-[var(--skeleton)] animate-pulse" />
        </div>
      )}

      {isError && (
        <div className="text-center py-20 text-[var(--text-muted)] text-sm">
          공지사항을 불러올 수 없습니다.
        </div>
      )}

      {notice && (
        <article>
          <header className="border-t border-b border-[var(--border-color)] py-6 mb-10">
            <div className="flex items-center gap-2 mb-3">
              {notice.pinned && (
                <Pin
                  className="w-4 h-4 text-[var(--text-primary)] -rotate-45 shrink-0"
                  strokeWidth={2}
                />
              )}
              <h2 className="text-lg text-[var(--text-primary)]">{notice.title}</h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
              <span>{formatDate(notice.createdAt)}</span>
              <span aria-hidden>·</span>
              <span>조회 {notice.viewCount ?? 0}</span>
            </div>
          </header>

          <div className="notice-content min-h-[200px] text-sm text-[var(--text-secondary)]">
            <ReactMarkdown>{notice.content}</ReactMarkdown>
          </div>

          <nav className="mt-16 border-t border-b border-[var(--border-color)]">
            <div className="flex items-center justify-between gap-3 py-5 border-b border-[var(--border-color)]">
              <span className="text-[11px] tracking-[0.2em] text-[var(--text-muted)] whitespace-nowrap min-w-[60px]">
                이전 글
              </span>
              {notice.prev ? (
                <Link
                  href={`/info/notice/${notice.prev.id}`}
                  className="flex-1 text-sm text-right text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors truncate"
                >
                  {notice.prev.title}
                </Link>
              ) : (
                <span className="flex-1 text-sm text-right text-[var(--text-muted)]">
                  이전 글이 없습니다.
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 py-5">
              <span className="text-[11px] tracking-[0.2em] text-[var(--text-muted)] whitespace-nowrap min-w-[60px]">
                다음 글
              </span>
              {notice.next ? (
                <Link
                  href={`/info/notice/${notice.next.id}`}
                  className="flex-1 text-sm text-right text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors truncate"
                >
                  {notice.next.title}
                </Link>
              ) : (
                <span className="flex-1 text-sm text-right text-[var(--text-muted)]">
                  다음 글이 없습니다.
                </span>
              )}
            </div>
          </nav>
        </article>
      )}

      <div className="mt-12">
        <Link
          href="/info/notice"
          className="inline-block text-xs tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          ← 목록으로
        </Link>
      </div>
    </div>
  );
}
