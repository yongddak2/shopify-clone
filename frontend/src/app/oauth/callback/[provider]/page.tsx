"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { socialLogin } from "@/lib/auth";
import {
  consumeState,
  getOAuthRedirectUri,
  SOCIAL_LABELS,
  type SocialProvider,
} from "@/lib/oauth";

const VALID_PROVIDERS: SocialProvider[] = ["kakao", "google", "naver"];

function OAuthCallbackContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  // StrictMode 이중 마운트·리렌더 시 토큰 교환 중복 호출 방지
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const provider = params.provider as SocialProvider;
    if (!VALID_PROVIDERS.includes(provider)) {
      setError("지원하지 않는 소셜 로그인입니다.");
      return;
    }

    // 사용자가 동의를 취소한 경우 등
    if (searchParams.get("error")) {
      setError("소셜 로그인이 취소되었습니다.");
      return;
    }

    const code = searchParams.get("code");
    const returnedState = searchParams.get("state");
    const savedState = consumeState();

    if (!code) {
      setError("인가 코드를 받지 못했습니다.");
      return;
    }
    if (!savedState || savedState !== returnedState) {
      setError("잘못된 접근입니다. 다시 시도해주세요.");
      return;
    }

    socialLogin(provider, code, getOAuthRedirectUri(provider), returnedState)
      .then(() => router.replace("/"))
      .catch((err: unknown) => {
        const message =
          err &&
          typeof err === "object" &&
          "response" in err &&
          (err as { response?: { data?: { error?: { message?: string } } } })
            .response?.data?.error?.message;
        setError(
          typeof message === "string"
            ? message
            : "소셜 로그인에 실패했습니다. 다시 시도해주세요."
        );
      });
  }, [params, searchParams, router]);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        {error ? (
          <>
            <p className="text-sm text-red-400 mb-6">{error}</p>
            <Link
              href="/login"
              className="text-sm text-[var(--text-primary)] underline underline-offset-4"
            >
              로그인으로 돌아가기
            </Link>
          </>
        ) : (
          <p className="text-sm tracking-wider text-[var(--text-muted)]">
            로그인 처리 중입니다...
          </p>
        )}
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
          <p className="text-sm tracking-wider text-[var(--text-muted)]">
            로그인 처리 중입니다...
          </p>
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
