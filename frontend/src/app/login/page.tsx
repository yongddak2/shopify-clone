"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { login } from "@/lib/auth";
import { startSocialLogin, type SocialProvider } from "@/lib/oauth";
import { getCart } from "@/lib/cart";
import { beginCheckout, consumePendingBuyNow } from "@/lib/checkoutSession";
import Button from "@/components/common/Button";
import { invalidateCartRelated } from "@/lib/queryInvalidator";

// 각사 브랜드 가이드라인 고정 색상 (테마 변수 대상 아님)
const SOCIAL_BUTTONS: {
  provider: SocialProvider;
  label: string;
  className: string;
}[] = [
  {
    provider: "kakao",
    label: "카카오로 시작하기",
    className: "bg-[#FEE500] text-[#191600] hover:brightness-95",
  },
  {
    provider: "naver",
    label: "네이버로 시작하기",
    className: "bg-[#03C75A] text-white hover:brightness-95",
  },
  {
    provider: "google",
    label: "구글로 시작하기",
    className:
      "bg-white text-[#3c4043] border border-[var(--border-color)] hover:bg-[var(--card-bg)]",
  },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
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

  const redirectTo = (() => {
    const value = searchParams.get("redirect");
    return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
  })();
  const redirectQuery =
    redirectTo === "/" ? "" : `?redirect=${encodeURIComponent(redirectTo)}`;

  const prepareBuyNowCheckout = async () => {
    const pending = consumePendingBuyNow();
    if (!pending) return;
    const cart = await getCart();
    const target = cart.data?.find(
      (item) => item.optionValueId === pending.optionValueId
    );
    if (target) beginCheckout([target.id]);
  };

  const handleSocialLogin = (provider: SocialProvider) => {
    setError("");
    try {
      startSocialLogin(provider, redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "소셜 로그인에 실패했습니다.");
    }
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
      await invalidateCartRelated(queryClient);
      await prepareBuyNowCheckout();
      router.push(redirectTo);
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

        {/* 소셜 로그인 */}
        <div className="mt-8">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-[var(--border-color)]" />
            <span className="text-xs tracking-wider text-[var(--text-dim)]">
              또는
            </span>
            <div className="flex-1 h-px bg-[var(--border-color)]" />
          </div>

          <div className="mt-6 space-y-3">
            {SOCIAL_BUTTONS.map(({ provider, label, className }) => (
              <button
                key={provider}
                type="button"
                onClick={() => handleSocialLogin(provider)}
                className={`w-full py-3 text-sm rounded-sm transition-all ${className}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-[var(--text-muted)] mt-8">
          계정이 없으신가요?{" "}
          <Link
            href={`/signup${redirectQuery}`}
            className="text-[var(--text-primary)] underline underline-offset-4"
          >
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6">
          <p className="text-sm tracking-wider text-[var(--text-muted)]">
            로그인 화면을 불러오는 중입니다...
          </p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
