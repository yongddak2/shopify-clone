"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Pin } from "lucide-react";
import { getNotices } from "@/lib/notice";

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("ko-KR");
}

function NoticeListContent() {
  const router = useRouter();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["notices", page],
    queryFn: () => getNotices(page, 10),
  });

  const notices = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;

  return (
    <div>
      <header className="mb-10">
        <h1 className="text-2xl tracking-[0.2em] font-light text-[var(--text-primary)]">
          NOTICE
        </h1>
        <p className="mt-3 text-xs tracking-wider text-[var(--text-dim)]">
          PanTrKa의 새로운 소식과 안내사항을 전해드립니다.
        </p>
      </header>

      {isLoading ? (
        <div className="space-y-3 py-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-[var(--skeleton)] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-y border-[var(--border-color)] text-[var(--text-muted)] text-xs tracking-wider">
                <th className="py-3 px-3 text-left w-[40px]" aria-hidden />
                <th className="py-3 px-3 text-left">제목</th>
                <th className="py-3 px-3 text-center w-[100px]">조회수</th>
                <th className="py-3 px-3 text-center w-[110px]">등록일</th>
              </tr>
            </thead>
            <tbody>
              {notices.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-20 text-center text-[var(--text-muted)] text-sm border-b border-[var(--border-color)]"
                  >
                    등록된 공지사항이 없습니다.
                  </td>
                </tr>
              )}
              {notices.map((n) => (
                <tr
                  key={n.id}
                  onClick={() => router.push(`/info/notice/${n.id}`)}
                  className="border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--card-bg)] transition-colors"
                >
                  <td className="py-4 px-3">
                    {n.pinned ? (
                      <Pin
                        className="w-3.5 h-3.5 text-[var(--text-primary)] -rotate-45"
                        strokeWidth={2}
                      />
                    ) : null}
                  </td>
                  <td className="py-4 px-3 text-[var(--text-secondary)]">
                    {n.title}
                  </td>
                  <td className="py-4 px-3 text-center text-[var(--text-muted)] text-xs tabular-nums">
                    {n.viewCount ?? 0}
                  </td>
                  <td className="py-4 px-3 text-center text-[var(--text-muted)] text-xs whitespace-nowrap">
                    {formatDate(n.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
  );
}

export default function NoticeListPage() {
  return (
    <Suspense fallback={<div />}>
      <NoticeListContent />
    </Suspense>
  );
}
