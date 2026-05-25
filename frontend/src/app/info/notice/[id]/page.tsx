"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
    <div className="min-h-[calc(100vh-64px)] px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl tracking-[0.2em] font-light text-center mb-12 text-[var(--text-primary)]">
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
              <div className="flex items-center gap-3 mb-3">
                {notice.pinned && (
                  <span className="inline-block px-2 py-0.5 text-[10px] tracking-wider bg-[var(--text-primary)] text-[var(--btn-primary-text)]">
                    PIN
                  </span>
                )}
                <h2 className="text-lg text-[var(--text-primary)]">{notice.title}</h2>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                {formatDate(notice.createdAt)}
              </p>
            </header>

            <div className="text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap min-h-[200px]">
              {notice.content}
            </div>
          </article>
        )}

        <div className="mt-16 text-center">
          <Link
            href="/info/notice"
            className="inline-block text-xs tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            ← 목록으로
          </Link>
        </div>
      </div>
    </div>
  );
}
