export type SocialProvider = "kakao" | "google" | "naver";

interface ProviderConfig {
  clientId: string | undefined;
  authorizeUrl: string;
  scope?: string;
  extraParams?: Record<string, string>;
}

// 클라이언트 ID는 빌드타임에 인라인되는 NEXT_PUBLIC_ 환경변수에서 주입
const PROVIDERS: Record<SocialProvider, ProviderConfig> = {
  kakao: {
    clientId: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID,
    authorizeUrl: "https://kauth.kakao.com/oauth/authorize",
    scope: "account_email,profile_nickname",
    extraParams: {
      prompt: "login",
    },
  },
  google: {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scope: "email profile",
    extraParams: {
      prompt: "select_account",
    },
  },
  naver: {
    clientId: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID,
    authorizeUrl: "https://nid.naver.com/oauth2.0/authorize",
  },
};

export const SOCIAL_LABELS: Record<SocialProvider, string> = {
  kakao: "카카오",
  google: "구글",
  naver: "네이버",
};

const STATE_KEY = "oauth_state";
const RETURN_TO_KEY = "oauth_return_to";
const PUBLIC_APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL?.replace(/\/+$/, "");

/** 백엔드 토큰 교환 시에도 동일하게 사용되므로 인가 요청과 콜백에서 같은 값을 생성해야 함 */
export function getOAuthRedirectUri(provider: SocialProvider): string {
  const origin = PUBLIC_APP_BASE_URL ?? window.location.origin;
  return `${origin}/oauth/callback/${provider}`;
}

/** 인가 요청 직전 state 생성·저장 (CSRF 방지) */
function issueState(): string {
  const state =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
          byte.toString(16).padStart(2, "0")
        ).join("");
  sessionStorage.setItem(STATE_KEY, state);
  return state;
}

/** 콜백에서 1회 소비 후 제거 */
export function consumeState(): string | null {
  const state = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  return state;
}

export function consumeOAuthReturnTo(): string | null {
  const returnTo = sessionStorage.getItem(RETURN_TO_KEY);
  sessionStorage.removeItem(RETURN_TO_KEY);
  return returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
    ? returnTo
    : null;
}

/**
 * 소셜 인가 페이지로 이동. 클라이언트 ID 미설정이면 Error throw (호출부에서 인라인 안내).
 */
export function startSocialLogin(provider: SocialProvider, returnTo?: string): void {
  const config = PROVIDERS[provider];
  if (!config.clientId) {
    throw new Error(`${SOCIAL_LABELS[provider]} 로그인은 아직 준비 중입니다.`);
  }
  if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    sessionStorage.setItem(RETURN_TO_KEY, returnTo);
  } else {
    sessionStorage.removeItem(RETURN_TO_KEY);
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: getOAuthRedirectUri(provider),
    state: issueState(),
  });
  if (config.scope) {
    params.set("scope", config.scope);
  }
  if (config.extraParams) {
    Object.entries(config.extraParams).forEach(([key, value]) => {
      params.set(key, value);
    });
  }

  window.location.href = `${config.authorizeUrl}?${params.toString()}`;
}
