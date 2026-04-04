"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminUsers } from "@/lib/admin";
import type { AdminUser } from "@/types";

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("ko-KR");
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", page],
    queryFn: () => getAdminUsers(page),
  });

  const users = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;

  return (
    <div className="p-8">
      <h1 className="text-xl font-light tracking-[0.15em] text-[var(--text-primary)] mb-8">
        USERS
      </h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-[var(--skeleton)] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] text-xs tracking-wider">
                <th className="py-3 px-3 text-left">ID</th>
                <th className="py-3 px-3 text-left">이메일</th>
                <th className="py-3 px-3 text-left">이름</th>
                <th className="py-3 px-3 text-left">전화번호</th>
                <th className="py-3 px-3 text-center">가입경로</th>
                <th className="py-3 px-3 text-center">권한</th>
                <th className="py-3 px-3 text-left">가입일</th>
                <th className="py-3 px-3 text-center">상태</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: AdminUser) => (
                <tr
                  key={u.id}
                  className="border-b border-[var(--border-color)] hover:bg-[var(--card-bg)] transition-colors"
                >
                  <td className="py-3 px-3 text-[var(--text-muted)]">{u.id}</td>
                  <td className="py-3 px-3 text-[var(--text-secondary)]">{u.email}</td>
                  <td className="py-3 px-3 text-[var(--text-secondary)]">{u.name}</td>
                  <td className="py-3 px-3 text-[var(--text-muted)]">{u.phone}</td>
                  <td className="py-3 px-3 text-center text-[var(--text-muted)]">{u.provider}</td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded ${
                        u.role === "ADMIN"
                          ? "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]"
                          : "bg-[var(--badge-gray-bg)] text-[var(--badge-gray-text)]"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[var(--text-muted)]">{formatDate(u.createdAt)}</td>
                  <td className="py-3 px-3 text-center">
                    {u.deletedAt ? (
                      <span className="text-xs text-[var(--badge-red-text)]">탈퇴</span>
                    ) : (
                      <span className="text-xs text-[var(--badge-green-text)]">활성</span>
                    )}
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
