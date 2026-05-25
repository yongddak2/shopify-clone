"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { deleteNotice, getAdminNotices } from "@/lib/admin";
import type { NoticeListItem } from "@/types";

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("ko-KR");
}

export default function AdminNoticesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<NoticeListItem | null>(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    setPage(0);
  }, [debouncedKeyword]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "notices", page, debouncedKeyword],
    queryFn: () => getAdminNotices(page, debouncedKeyword),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteNotice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "notices"] });
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      setDeleteTarget(null);
      setDeleteError("");
    },
    onError: () => {
      setDeleteTarget(null);
      setDeleteError("삭제에 실패했습니다.");
    },
  });

  const notices = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-xl font-light tracking-[0.15em] text-[var(--text-primary)]">
          NOTICES
        </h1>
        <Link
          href="/admin/notices/new"
          className="px-4 py-2 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors whitespace-nowrap"
        >
          공지 등록
        </Link>
      </div>

      <div className="relative max-w-md mb-6">
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

      {deleteError && <p className="text-sm text-red-400 mb-4">{deleteError}</p>}

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
              <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] text-xs tracking-wider">
                <th className="py-3 px-3 text-left w-[60px]">ID</th>
                <th className="py-3 px-3 text-center w-[60px]">고정</th>
                <th className="py-3 px-3 text-left">제목</th>
                <th className="py-3 px-3 text-left w-[110px]">등록일</th>
                <th className="py-3 px-3 text-center w-[120px]">관리</th>
              </tr>
            </thead>
            <tbody>
              {notices.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-[var(--text-muted)] text-xs"
                  >
                    {debouncedKeyword
                      ? `"${debouncedKeyword}" 검색 결과가 없습니다.`
                      : "등록된 공지사항이 없습니다."}
                  </td>
                </tr>
              )}
              {notices.map((n) => (
                <tr
                  key={n.id}
                  className="border-b border-[var(--border-color)] hover:bg-[var(--card-bg)] transition-colors"
                >
                  <td className="py-3 px-3 text-[var(--text-muted)]">{n.id}</td>
                  <td className="py-3 px-3 text-center">
                    {n.pinned ? (
                      <span className="inline-block px-2 py-0.5 text-[10px] tracking-wider bg-[var(--text-primary)] text-[var(--btn-primary-text)]">
                        PIN
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)] text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <Link
                      href={`/info/notice/${n.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline"
                    >
                      {n.title}
                    </Link>
                  </td>
                  <td className="py-3 px-3 text-[var(--text-muted)]">
                    {formatDate(n.createdAt)}
                  </td>
                  <td className="py-3 px-3 text-center space-x-3">
                    <button
                      onClick={() => router.push(`/admin/notices/${n.id}/edit`)}
                      className="text-xs text-[var(--badge-blue-text)] hover:underline"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => {
                        setDeleteTarget(n);
                        setDeleteError("");
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

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--overlay-bg)]"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-sm w-full mx-6 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              공지사항을 삭제하시겠습니까?
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
