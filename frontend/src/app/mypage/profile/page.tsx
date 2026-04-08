"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyInfo, changePassword } from "@/lib/user";
import { logout } from "@/lib/auth";
import { Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";
import { invalidateUserRelated } from "@/lib/queryInvalidator";
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn, setUser } = useAuthStore();
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
      setPhone(formatPhone(user.phone ?? ""));
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

    updateMutation.mutate({ name: name.trim(), phone: phone.replace(/\D/g, "") });
  };

  const pwMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setPwSuccess("비밀번호가 변경되었습니다.");
      setPwError("");
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
      invalidateUserRelated(queryClient);
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ?? "비밀번호 변경에 실패했습니다.";
      setPwError(msg);
      setPwSuccess("");
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      setPwError("모든 항목을 입력해주세요.");
      return;
    }
    if (
      newPassword.length < 8 ||
      !/[a-zA-Z]/.test(newPassword) ||
      !/\d/.test(newPassword) ||
      !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)
    ) {
      setPwError("비밀번호는 8자 이상, 영문+숫자+특수문자를 포함해야 합니다.");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setPwError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    pwMutation.mutate({ currentPassword, newPassword, newPasswordConfirm });
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

        {/* 마지막 변경일 + 안내 문구 */}
        <div className="mb-6 text-xs text-[var(--text-muted)] space-y-1">
          <p>
            마지막 변경일:{" "}
            {user?.passwordChangedAt
              ? new Date(user.passwordChangedAt).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }).replace(/\. /g, ".").replace(/\.$/, "")
              : "변경 이력 없음"}
          </p>
          <p>비밀번호는 30일에 한 번 변경할 수 있습니다.</p>
        </div>

        <form onSubmit={handlePasswordSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              현재 비밀번호
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
                placeholder="현재 비밀번호를 입력하세요"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              새 비밀번호
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                placeholder="영문, 숫자, 특수문자 포함 8자 이상"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {newPassword && (
              <div className="mt-1.5 space-y-0.5">
                <p className={`text-xs ${newPassword.length >= 8 ? "text-[var(--badge-green-text)]" : "text-[var(--text-dim)]"}`}>
                  {newPassword.length >= 8 ? "\u2713" : "\u2022"} 8자 이상
                </p>
                <p className={`text-xs ${/[a-zA-Z]/.test(newPassword) ? "text-[var(--badge-green-text)]" : "text-[var(--text-dim)]"}`}>
                  {/[a-zA-Z]/.test(newPassword) ? "\u2713" : "\u2022"} 영문 포함
                </p>
                <p className={`text-xs ${/\d/.test(newPassword) ? "text-[var(--badge-green-text)]" : "text-[var(--text-dim)]"}`}>
                  {/\d/.test(newPassword) ? "\u2713" : "\u2022"} 숫자 포함
                </p>
                <p className={`text-xs ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? "text-[var(--badge-green-text)]" : "text-[var(--text-dim)]"}`}>
                  {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? "\u2713" : "\u2022"} 특수문자 포함
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              새 비밀번호 확인
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                className={inputClass}
                placeholder="새 비밀번호를 다시 입력하세요"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {newPassword && newPasswordConfirm && (
              <p className={`text-xs mt-1 ${newPassword === newPasswordConfirm ? "text-[var(--badge-green-text)]" : "text-red-400"}`}>
                {newPassword === newPasswordConfirm
                  ? "\u2713 비밀번호가 일치합니다"
                  : "\u2717 비밀번호가 일치하지 않습니다"}
              </p>
            )}
          </div>

          <div className="min-h-[1.5rem]">
            {pwError && <p className="text-sm text-red-400">{pwError}</p>}
            {pwSuccess && (
              <p className="text-sm text-[var(--badge-green-text)]">
                {pwSuccess}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={pwMutation.isPending}
            className="w-full py-3 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors"
          >
            {pwMutation.isPending ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>
      </div>

      {/* 회원 탈퇴 */}
      <div className="mt-16 pt-8 border-t border-[var(--border-color)] max-w-md">
        <h3 className="text-sm font-medium tracking-wider text-red-400 mb-4">
          회원 탈퇴
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-4">
          탈퇴 시 모든 주문 내역, 배송지, 쿠폰 등의 정보가 삭제되며 복구할 수 없습니다.
        </p>
        <button
          onClick={() => setWithdrawModal(true)}
          className="px-5 py-2.5 text-xs border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors"
        >
          회원 탈퇴
        </button>
      </div>

      {/* 탈퇴 확인 모달 */}
      {withdrawModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--overlay-bg)]"
            onClick={() => setWithdrawModal(false)}
          />
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-sm w-full mx-6 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              정말 탈퇴하시겠습니까?
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-8">
              탈퇴 시 모든 정보가 삭제됩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setWithdrawModal(false)}
                className="flex-1 py-3 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  setWithdrawing(true);
                  try {
                    await api.delete("/api/users/me");
                    await logout();
                    router.replace("/");
                  } catch {
                    setWithdrawing(false);
                    setWithdrawModal(false);
                    setError("탈퇴 처리에 실패했습니다.");
                  }
                }}
                disabled={withdrawing}
                className="flex-1 py-3 text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                {withdrawing ? "처리 중..." : "탈퇴하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
