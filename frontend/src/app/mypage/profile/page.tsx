"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getMyInfo } from "@/lib/user";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { ApiResponse, User } from "@/types";

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

const inputClass =
  "w-full bg-[var(--input-bg)] border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)] transition-colors placeholder-[var(--text-dim)]";

export default function MypageProfilePage() {
  const { isLoggedIn, setUser } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["myInfo"],
    queryFn: getMyInfo,
    enabled: isLoggedIn(),
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const user = data?.data;

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? "");
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; phone: string }) => {
      const res = await api.patch<ApiResponse<User>>("/api/users/me", data);
      return res.data;
    },
    onSuccess: (res) => {
      setUser(res.data);
      setSuccess("회원정보가 수정되었습니다.");
      setError("");
    },
    onError: () => {
      setError("수정에 실패했습니다.");
      setSuccess("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (!name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }
    if (!phone.trim()) {
      setError("전화번호를 입력해주세요.");
      return;
    }

    updateMutation.mutate({ name: name.trim(), phone: phone.trim() });
  };

  if (isLoading) {
    return (
      <div>
        <h2 className="text-lg tracking-[0.1em] font-light text-[var(--text-primary)] mb-8">
          회원정보 수정
        </h2>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-[var(--skeleton)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg tracking-[0.1em] font-light text-[var(--text-primary)] mb-8">
        회원정보 수정
      </h2>

      <form onSubmit={handleSubmit} noValidate className="max-w-md space-y-6">
        {/* 이메일 (읽기 전용) */}
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">
            이메일
          </label>
          <input
            value={user?.email ?? ""}
            readOnly
            className={`${inputClass} opacity-60 cursor-not-allowed`}
          />
        </div>

        {/* 이름 */}
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">
            이름
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="이름을 입력하세요"
          />
        </div>

        {/* 전화번호 */}
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">
            전화번호
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            maxLength={13}
            className={inputClass}
            placeholder="010-1234-5678"
          />
        </div>

        <div className="min-h-[1.5rem]">
          {error && <p className="text-sm text-red-400">{error}</p>}
          {success && (
            <p className="text-sm text-[var(--badge-green-text)]">{success}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="w-full py-3 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors"
        >
          {updateMutation.isPending ? "저장 중..." : "저장"}
        </button>
      </form>

      {/* 비밀번호 변경 */}
      <div className="mt-16 pt-8 border-t border-[var(--border-color)] max-w-md">
        <h3 className="text-sm font-medium tracking-wider text-[var(--text-primary)] mb-4">
          비밀번호 변경
        </h3>
        <div className="border border-dashed border-[var(--border-color)] p-6 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            준비 중인 기능입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
