"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { sendResetCode, verifyResetCode, resetPassword } from "@/lib/auth";
import Button from "@/components/common/Button";

const RESET_CODE_TTL_SECONDS = 180; // 3분
const RESEND_COOLTIME_SECONDS = 30;

type Step = 1 | 2 | 3;

interface ApiError {
  response?: { data?: { error?: { message?: string }; message?: string } };
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const e = err as ApiError;
    return (
      e.response?.data?.error?.message ||
      e.response?.data?.message ||
      fallback
    );
  }
  return fallback;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [email, setEmail] = useState("");

  // Step 2
  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESET_CODE_TTL_SECONDS);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [resendCooltime, setResendCooltime] = useState(0);
  const cooltimeRef = useRef<NodeJS.Timeout | null>(null);

  // Step 3
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Timer
  useEffect(() => {
    if (step !== 2) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  const startTimer = () => {
    setSecondsLeft(RESET_CODE_TTL_SECONDS);
  };

  const startCooltime = () => {
    setResendCooltime(RESEND_COOLTIME_SECONDS);
    if (cooltimeRef.current) clearInterval(cooltimeRef.current);
    cooltimeRef.current = setInterval(() => {
      setResendCooltime((prev) => {
        if (prev <= 1) {
          if (cooltimeRef.current) clearInterval(cooltimeRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (cooltimeRef.current) clearInterval(cooltimeRef.current);
    };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Step 1 → Step 2
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("이메일을 입력해주세요");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("올바른 이메일 형식이 아닙니다");
      return;
    }
    setLoading(true);
    try {
      await sendResetCode(email);
      setStep(2);
      startTimer();
      startCooltime();
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "인증번호 발송에 실패했습니다"));
    } finally {
      setLoading(false);
    }
  };

  // 재발송
  const handleResend = async () => {
    if (resendCooltime > 0 || loading) return;
    setError("");
    setLoading(true);
    try {
      await sendResetCode(email);
      setCode("");
      startTimer();
      startCooltime();
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "인증번호 발송에 실패했습니다"));
    } finally {
      setLoading(false);
    }
  };

  // Step 2 → Step 3
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(code)) {
      setError("인증번호 6자리를 입력해주세요");
      return;
    }
    if (secondsLeft === 0) {
      setError("인증번호가 만료되었습니다. 재발송해주세요");
      return;
    }
    setLoading(true);
    try {
      await verifyResetCode(email, code);
      setStep(3);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "인증에 실패했습니다"));
    } finally {
      setLoading(false);
    }
  };

  // Password validation
  const passwordChecks = {
    length: newPassword.length >= 8,
    letter: /[a-zA-Z]/.test(newPassword),
    digit: /\d/.test(newPassword),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword),
  };
  const allChecksPassed =
    passwordChecks.length &&
    passwordChecks.letter &&
    passwordChecks.digit &&
    passwordChecks.special;
  const passwordsMatch =
    newPassword.length > 0 && newPassword === newPasswordConfirm;

  // Step 3 → 완료
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!allChecksPassed) {
      setError("비밀번호 조건을 충족해주세요");
      return;
    }
    if (!passwordsMatch) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email, newPassword, newPasswordConfirm);
      alert("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
      router.push("/login");
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "비밀번호 변경에 실패했습니다"));
    } finally {
      setLoading(false);
    }
  };

  // Step Indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-12">
      {[1, 2, 3].map((s, idx) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border ${
              step >= s
                ? "border-[var(--text-primary)] text-[var(--text-primary)]"
                : "border-[var(--border-color)] text-[var(--text-dim)]"
            }`}
          >
            {s}
          </div>
          {idx < 2 && (
            <div
              className={`w-12 h-px mx-2 ${
                step > s
                  ? "bg-[var(--text-primary)]"
                  : "bg-[var(--border-color)]"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl tracking-[0.2em] font-light text-center mb-10 text-[var(--text-primary)]">
          FORGOT PASSWORD
        </h1>

        <StepIndicator />

        {/* Step 1 - 이메일 입력 */}
        {step === 1 && (
          <form onSubmit={handleSendCode} noValidate className="space-y-6">
            <p className="text-xs text-[var(--text-muted)] text-center mb-4">
              가입하신 이메일로 인증번호를 발송합니다
            </p>
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

            <div className="pt-4">
              <div className="min-h-[1.5rem] mb-2">
                {error && (
                  <p className="text-sm text-red-400 text-center">{error}</p>
                )}
              </div>
              <Button type="submit" fullWidth loading={loading}>
                인증번호 발송
              </Button>
            </div>
          </form>
        )}

        {/* Step 2 - 인증번호 확인 */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode} noValidate className="space-y-6">
            <p className="text-xs text-[var(--text-muted)] text-center mb-4">
              <span className="text-[var(--text-secondary)]">{email}</span>로
              <br />
              발송된 인증번호 6자리를 입력해주세요
            </p>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs tracking-wider text-[var(--text-muted)]">
                  인증번호
                </label>
                <span
                  className={`text-xs ${
                    secondsLeft === 0
                      ? "text-red-400"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  {secondsLeft === 0
                    ? "만료됨"
                    : `남은 시간 ${formatTime(secondsLeft)}`}
                </span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                className="w-full border-b border-[var(--border-color)] bg-transparent py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors placeholder-[var(--text-dim)] tracking-[0.3em]"
                placeholder="000000"
              />
            </div>

            <div className="pt-4">
              <div className="min-h-[1.5rem] mb-2">
                {error && (
                  <p className="text-sm text-red-400 text-center">{error}</p>
                )}
              </div>
              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={secondsLeft === 0}
              >
                확인
              </Button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooltime > 0 || loading}
                className="w-full mt-3 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40 disabled:hover:text-[var(--text-muted)]"
              >
                {resendCooltime > 0
                  ? `${resendCooltime}초 후 재발송 가능`
                  : "인증번호 재발송"}
              </button>
            </div>
          </form>
        )}

        {/* Step 3 - 새 비밀번호 입력 */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} noValidate className="space-y-6">
            <p className="text-xs text-[var(--text-muted)] text-center mb-4">
              새로 사용할 비밀번호를 입력해주세요
            </p>

            <div>
              <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
                새 비밀번호
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError("");
                  }}
                  className="w-full border-b border-[var(--border-color)] bg-transparent py-2 pr-9 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors placeholder-[var(--text-dim)]"
                  placeholder="새 비밀번호"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  tabIndex={-1}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {newPassword.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p
                    className={`text-xs ${
                      passwordChecks.length
                        ? "text-green-400"
                        : "text-[var(--text-dim)]"
                    }`}
                  >
                    ✓ 8자 이상
                  </p>
                  <p
                    className={`text-xs ${
                      passwordChecks.letter
                        ? "text-green-400"
                        : "text-[var(--text-dim)]"
                    }`}
                  >
                    ✓ 영문 포함
                  </p>
                  <p
                    className={`text-xs ${
                      passwordChecks.digit
                        ? "text-green-400"
                        : "text-[var(--text-dim)]"
                    }`}
                  >
                    ✓ 숫자 포함
                  </p>
                  <p
                    className={`text-xs ${
                      passwordChecks.special
                        ? "text-green-400"
                        : "text-[var(--text-dim)]"
                    }`}
                  >
                    ✓ 특수문자 포함
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
                새 비밀번호 확인
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={newPasswordConfirm}
                  onChange={(e) => {
                    setNewPasswordConfirm(e.target.value);
                    setError("");
                  }}
                  className="w-full border-b border-[var(--border-color)] bg-transparent py-2 pr-9 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors placeholder-[var(--text-dim)]"
                  placeholder="비밀번호 확인"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {newPasswordConfirm.length > 0 && (
                <p
                  className={`text-xs mt-2 ${
                    passwordsMatch ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {passwordsMatch
                    ? "✓ 비밀번호가 일치합니다"
                    : "✗ 비밀번호가 일치하지 않습니다"}
                </p>
              )}
            </div>

            <div className="pt-4">
              <div className="min-h-[1.5rem] mb-2">
                {error && (
                  <p className="text-sm text-red-400 text-center">{error}</p>
                )}
              </div>
              <Button type="submit" fullWidth loading={loading}>
                비밀번호 변경
              </Button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-[var(--text-muted)] mt-8">
          <Link
            href="/login"
            className="text-[var(--text-primary)] underline underline-offset-4"
          >
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
