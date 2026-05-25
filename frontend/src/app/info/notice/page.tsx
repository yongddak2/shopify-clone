"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getNotices } from "@/lib/notice";

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("ko-KR");
}

function NoticeListContent() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["notices", page],
    queryFn: () => getNotices(page, 10),
  });

  const notices = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;

  return (
    <div className="min-h-[calc(100vh-64px)] px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl tracking-[0.2em] font-light text-center mb-12 text-[var(--text-primary)]">
          NOTICE
        </h1>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-[var(--skeleton)] animate-pulse" />
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-muted)] text-sm">
            등록된 공지사항이 없습니다.
          </div>
        ) : (
          <ul className="border-t border-[var(--border-color)]">
            {notices.map((n) => (
              <li
                key={n.id}
                className="border-b border-[var(--border-color)]"
              >
                <Link
                  href={`/info/notice/${n.id}`}
                  className="flex items-center gap-3 py-5 px-2 hover:bg-[var(--card-bg)] transition-colors"
                >
                  {n.pinned && (
                    <span className="inline-block px-2 py-0.5 text-[10px] tracking-wider bg-[var(--text-primary)] text-[var(--btn-primary-text)]">
                      PIN
                    </span>
                  )}
                  <span className="flex-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    {n.title}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                    {formatDate(n.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-9 h-9 text-xs transition-colors ${
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
      </div>
    </div>
  );
}

export default function NoticeListPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-64px)]" />}>
      <NoticeListContent />
    </Suspense>
  );
}
