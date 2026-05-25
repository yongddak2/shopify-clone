"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { getQnas } from "@/lib/qna";
import { useAuthStore } from "@/stores/authStore";
import type { SupportCategory } from "@/types";

const CATEGORY_TABS: { value: SupportCategory | "ALL"; label: string }[] = [
  { value: "ALL", label: "ALL" },
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

function QnaContent() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [page, setPage] = useState(0);
  const [category, setCategory] = useState<SupportCategory | "ALL">("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["qnas", page, category],
    queryFn: () => getQnas(page, 10, category === "ALL" ? undefined : category),
  });

  const qnas = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;

  const handleWriteClick = () => {
    if (!isLoggedIn()) {
      alert("로그인이 필요한 서비스입니다.");
      router.push("/login");
      return;
    }
    router.push("/info/qa/new");
  };

  const handleRowClick = (id: number, visible: boolean) => {
    if (!visible) {
      if (!isLoggedIn()) {
        alert("로그인이 필요한 서비스입니다.");
        router.push("/login");
        return;
      }
      alert("비밀글은 작성자와 관리자만 확인할 수 있습니다.");
      return;
    }
    router.push(`/info/qa/${id}`);
  };

  return (
    <div>
      <header className="mb-10">
        <h1 className="text-2xl tracking-[0.2em] font-light text-[var(--text-primary)]">
          Q&amp;A
        </h1>
        <p className="mt-3 text-xs tracking-wider text-[var(--text-dim)]">
          궁금한 점을 직접 문의하실 수 있습니다.
        </p>
      </header>

      <div>
        <div className="flex items-center gap-6 overflow-x-auto pb-4 mb-6 border-b border-[var(--border-color)] scrollbar-hide">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setCategory(tab.value);
                setPage(0);
              }}
              className={`text-xs tracking-widest whitespace-nowrap transition-colors ${
                category === tab.value
                  ? "text-[var(--text-primary)] font-semibold border-b-2 border-[var(--text-primary)] pb-1"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            보통 영업일 기준 1~2일 내 답변 드립니다. (주말·공휴일 제외)
          </p>
          <button
            onClick={handleWriteClick}
            className="px-4 py-2 text-xs tracking-widest bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors"
          >
            문의 작성
          </button>
        </div>

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
                  <th className="py-3 px-3 text-left w-[110px]">작성자</th>
                  <th className="py-3 px-3 text-left w-[110px]">등록일</th>
                </tr>
              </thead>
              <tbody>
                {qnas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-[var(--text-muted)] text-sm">
                      등록된 문의가 없습니다.
                    </td>
                  </tr>
                )}
                {qnas.map((q) => (
                  <tr
                    key={q.id}
                    onClick={() => handleRowClick(q.id, q.visible)}
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
                    <td className="py-4 px-3 text-[var(--text-muted)] text-xs">{q.authorMasked}</td>
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

export default function QnaListPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-64px)]" />}>
      <QnaContent />
    </Suspense>
  );
}
