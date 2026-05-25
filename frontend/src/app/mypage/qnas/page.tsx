"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { getMyQnas } from "@/lib/qna";

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("ko-KR");
}

export default function MyQnasPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["mypage", "qnas", page],
    queryFn: () => getMyQnas(page, 10),
  });

  const qnas = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-xl tracking-[0.15em] text-[var(--text-primary)] font-light">
          내 문의
        </h1>
        <Link
          href="/info/qa/new"
          className="px-4 py-2 text-xs tracking-widest bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors"
        >
          문의 작성
        </Link>
      </div>

      <p className="text-xs text-[var(--text-muted)] mb-4">
        보통 영업일 기준 1~2일 내 답변 드립니다.
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-[var(--skeleton)] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-y border-[var(--border-color)] text-[var(--text-muted)] text-xs tracking-wider">
                <th className="py-3 px-3 text-left w-[60px]">번호</th>
                <th className="py-3 px-3 text-left w-[90px]">카테고리</th>
                <th className="py-3 px-3 text-left">제목</th>
                <th className="py-3 px-3 text-center w-[90px]">상태</th>
                <th className="py-3 px-3 text-left w-[110px]">등록일</th>
              </tr>
            </thead>
            <tbody>
              {qnas.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-[var(--text-muted)] text-sm">
                    작성한 문의가 없습니다.
                  </td>
                </tr>
              )}
              {qnas.map((q) => (
                <tr
                  key={q.id}
                  onClick={() => router.push(`/info/qa/${q.id}`)}
                  className="border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--card-bg)] transition-colors"
                >
                  <td className="py-4 px-3 text-[var(--text-muted)] text-xs">{q.id}</td>
                  <td className="py-4 px-3 text-[var(--text-muted)] text-xs tracking-wider">
                    {q.categoryLabel}
                  </td>
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      {q.secret && (
                        <Lock className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" strokeWidth={1.5} />
                      )}
                      <span>{q.title}</span>
                    </div>
                  </td>
                  <td className="py-4 px-3 text-center">
                    {q.answered ? (
                      <span className="inline-block px-2 py-0.5 text-[10px] tracking-wider bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]">
                        답변완료
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 text-[10px] tracking-wider bg-[var(--badge-gray-bg)] text-[var(--badge-gray-text)]">
                        답변대기
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-3 text-[var(--text-muted)] text-xs">
                    {formatDate(q.createdAt)}
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
    </div>
  );
}
