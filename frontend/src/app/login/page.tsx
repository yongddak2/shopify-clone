"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/auth";
import Button from "@/components/common/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (!email.trim()) return "이메일을 입력해주세요";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "올바른 이메일 형식이 아닙니다";
    if (!password.trim()) return "비밀번호를 입력해주세요";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { error?: { message?: string } } } })
          .response?.data?.error?.message
      ) {
        setError(
          (err as { response: { data: { error: { message: string } } } })
            .response.data.error.message
        );
      } else {
        setError("로그인에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl tracking-[0.2em] font-light text-center mb-12 text-[var(--text-primary)]">
          LOGIN
        </h1>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div>
            <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              className="w-full border-b border-[var(--border-color)] bg-transparent py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors placeholder-[var(--text-dim)]"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className="w-full border-b border-[var(--border-color)] bg-transparent py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors placeholder-[var(--text-dim)]"
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          <div className="pt-4">
            {/* 에러 메시지 (공간 미리 확보) */}
            <div className="min-h-[1.5rem] mb-2">
              {error && (
                <p className="text-sm text-red-400 text-center">{error}</p>
              )}
            </div>
            <Button type="submit" fullWidth loading={loading}>
              로그인
            </Button>
            <div className="text-center mt-4">
              <Link
                href="/forgot-password"
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors underline underline-offset-4"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>
          </div>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)] mt-8">
          계정이 없으신가요?{" "}
          <Link
            href="/signup"
            className="text-[var(--text-primary)] underline underline-offset-4"
          >
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
