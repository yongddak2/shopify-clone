"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { signup } from "@/lib/auth";
import Button from "@/components/common/Button";

type AgreementKey = "terms" | "privacy" | "marketing";

const AGREEMENT_CONTENTS: Record<AgreementKey, { title: string; body: string }> = {
  terms: {
    title: "이용약관",
    body: `제1조 (목적)
본 약관은 [서비스명](이하 "회사")이 제공하는 온라인 쇼핑몰 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
1. "서비스"란 회사가 제공하는 모든 온라인 상품 판매 및 관련 서비스를 의미합니다.
2. "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.
3. "회원"이란 회사에 개인정보를 제공하여 회원등록을 한 자를 말합니다.

제3조 (약관의 효력 및 변경)
1. 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력을 발생합니다.
2. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.

제4조 (회원가입)
1. 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.
2. 회사는 다음 각 호에 해당하는 신청에 대하여는 승낙하지 않을 수 있습니다.
   - 가입신청자가 본 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우
   - 실명이 아니거나 타인의 명의를 이용한 경우
   - 허위의 정보를 기재하거나, 회사가 제시하는 내용을 기재하지 않은 경우

제5조 (서비스의 제공 및 변경)
회사는 다음과 같은 업무를 수행합니다.
1. 상품 또는 용역에 대한 정보 제공 및 구매계약의 체결
2. 구매계약이 체결된 상품 또는 용역의 배송
3. 기타 회사가 정하는 업무

[이하 약관 내용은 추후 실제 약관으로 교체 예정입니다.]`,
  },
  privacy: {
    title: "개인정보 수집 및 이용 동의",
    body: `[서비스명]은 회원가입 및 서비스 제공을 위하여 아래와 같이 개인정보를 수집·이용합니다.

1. 수집하는 개인정보 항목
   - 필수항목: 이메일, 비밀번호, 이름, 휴대전화번호
   - 선택항목: 생년월일, 성별, 주소

2. 개인정보의 수집 및 이용 목적
   - 회원 가입 및 관리: 회원제 서비스 이용에 따른 본인확인, 개인 식별
   - 재화 또는 서비스 제공: 물품 배송, 청구서 발송, 구매 및 요금 결제
   - 마케팅 및 광고에의 활용 (선택 동의 시)
   - 민원처리, 분쟁 조정을 위한 기록 보존

3. 개인정보의 보유 및 이용 기간
   - 회원 탈퇴 시까지 (단, 관계 법령에 의해 보존할 필요가 있는 경우 해당 기간 동안 보관)
   - 계약 또는 청약철회 등에 관한 기록: 5년
   - 대금결제 및 재화 등의 공급에 관한 기록: 5년
   - 소비자의 불만 또는 분쟁처리에 관한 기록: 3년

4. 동의 거부 권리 및 거부 시 불이익
   이용자는 개인정보 수집·이용에 동의하지 않을 권리가 있습니다. 다만, 필수항목 수집에 동의하지 않으실 경우 회원가입이 제한됩니다.

[본 내용은 플레이스홀더이며, 추후 실제 개인정보처리방침으로 교체 예정입니다.]`,
  },
  marketing: {
    title: "마케팅 정보 수신 동의",
    body: `[서비스명]은 회원에게 다양한 혜택과 이벤트 정보를 제공하기 위하여 아래와 같이 마케팅 정보 수신 동의를 받고 있습니다.

1. 수집·이용 목적
   - 신상품 및 이벤트 정보 안내
   - 할인 쿠폰 및 프로모션 정보 제공
   - 맞춤형 광고 및 상품 추천
   - 고객 만족도 조사 및 사은행사 안내

2. 수신 방법
   - 이메일, SMS, 카카오 알림톡, 앱 푸시 알림

3. 보유 및 이용 기간
   - 회원 탈퇴 시 또는 수신 동의 철회 시까지

4. 동의 거부권 및 철회 방법
   - 본 동의는 선택사항이며, 동의하지 않으셔도 회원가입 및 서비스 이용에는 제한이 없습니다.
   - 동의 후에도 마이페이지 > 회원정보 수정에서 언제든지 철회하실 수 있습니다.

[사업자명] 드림.

[본 내용은 플레이스홀더이며, 추후 실제 마케팅 정보 수신 약관으로 교체 예정입니다.]`,
  },
};

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

interface FormErrors {
  email?: string;
  password?: string;
  passwordConfirm?: string;
  name?: string;
  phone?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    name: "",
    phone: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const [agreements, setAgreements] = useState<Record<AgreementKey, boolean>>({
    terms: false,
    privacy: false,
    marketing: false,
  });
  const [agreementError, setAgreementError] = useState("");
  const [openModal, setOpenModal] = useState<AgreementKey | null>(null);

  const allChecked =
    agreements.terms && agreements.privacy && agreements.marketing;
  const requiredChecked = agreements.terms && agreements.privacy;

  const toggleAgreement = (key: AgreementKey) => {
    setAgreements((prev) => ({ ...prev, [key]: !prev[key] }));
    setAgreementError("");
  };

  const toggleAll = () => {
    const next = !allChecked;
    setAgreements({ terms: next, privacy: next, marketing: next });
    setAgreementError("");
  };

  // 모달 열림 시 body 스크롤 락 + ESC 키로 닫기
  useEffect(() => {
    if (!openModal) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenModal(null);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openModal]);

  const updateField = (field: string, value: string) => {
    if (field === "phone") {
      setForm((prev) => ({ ...prev, phone: formatPhone(value) }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerError("");
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.email.trim()) {
      newErrors.email = "이메일을 입력해주세요";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "올바른 이메일 형식이 아닙니다";
    }

    if (!form.password.trim()) {
      newErrors.password = "비밀번호를 입력해주세요";
    } else if (
      !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=]).{8,}$/.test(
        form.password
      )
    ) {
      newErrors.password =
        "비밀번호는 8자 이상, 영문+숫자+특수문자를 포함해야 합니다";
    }

    if (form.password !== form.passwordConfirm) {
      newErrors.passwordConfirm = "비밀번호가 일치하지 않습니다";
    }

    if (!form.name.trim()) {
      newErrors.name = "이름을 입력해주세요";
    }

    if (!form.phone.trim()) {
      newErrors.phone = "전화번호를 입력해주세요";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    if (!requiredChecked) {
      setAgreementError("필수 약관에 모두 동의해주세요");
      return;
    }

    setLoading(true);
    try {
      await signup(form.email, form.password, form.name, form.phone.replace(/\D/g, ""));
      alert("회원가입이 완료되었습니다.");
      router.push("/login");
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { error?: { message?: string } } } })
          .response?.data?.error?.message
      ) {
        setServerError(
          (err as { response: { data: { error: { message: string } } } })
            .response.data.error.message
        );
      } else {
        setServerError("회원가입에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      key: "email",
      label: "이메일",
      type: "email",
      placeholder: "example@email.com",
    },
    {
      key: "password",
      label: "비밀번호",
      type: "password",
      placeholder: "영문+숫자+특수문자 8자 이상",
    },
    {
      key: "passwordConfirm",
      label: "비밀번호 확인",
      type: "password",
      placeholder: "비밀번호를 다시 입력하세요",
    },
    { key: "name", label: "이름", type: "text", placeholder: "홍길동" },
    {
      key: "phone",
      label: "전화번호",
      type: "tel",
      placeholder: "010-1234-5678",
    },
  ] as const;

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <h1 className="text-2xl tracking-[0.2em] font-light text-center mb-12 text-[var(--text-primary)]">
          JOIN
        </h1>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
                {field.label}
              </label>
              <input
                type={field.type}
                value={form[field.key]}
                onChange={(e) => updateField(field.key, e.target.value)}
                maxLength={field.key === "phone" ? 13 : undefined}
                className="w-full border-b border-[var(--border-color)] bg-transparent py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors placeholder-[var(--text-dim)]"
                placeholder={field.placeholder}
              />
              {errors[field.key as keyof FormErrors] && (
                <p className="text-red-400 text-xs mt-1">
                  {errors[field.key as keyof FormErrors]}
                </p>
              )}
            </div>
          ))}

          {/* 약관 동의 섹션 */}
          <div className="pt-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <span
                className={`flex items-center justify-center w-5 h-5 border transition-colors ${
                  allChecked
                    ? "bg-[var(--text-primary)] border-[var(--text-primary)]"
                    : "border-[var(--border-color)] group-hover:border-[var(--text-muted)]"
                }`}
              >
                {allChecked && (
                  <Check className="w-3.5 h-3.5 text-[var(--btn-primary-text)]" strokeWidth={3} />
                )}
              </span>
              <input
                type="checkbox"
                checked={allChecked}
                onChange={toggleAll}
                className="sr-only"
              />
              <span className="text-sm text-[var(--text-primary)] tracking-wider">
                전체 동의
              </span>
            </label>

            <div className="border-t border-[var(--border-color)]" />

            {(
              [
                { key: "terms", label: "이용약관 동의", required: true },
                { key: "privacy", label: "개인정보 수집 및 이용 동의", required: true },
                { key: "marketing", label: "마케팅 정보 수신 동의", required: false },
              ] as const
            ).map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer group flex-1">
                  <span
                    className={`flex items-center justify-center w-5 h-5 border transition-colors ${
                      agreements[item.key]
                        ? "bg-[var(--text-primary)] border-[var(--text-primary)]"
                        : "border-[var(--border-color)] group-hover:border-[var(--text-muted)]"
                    }`}
                  >
                    {agreements[item.key] && (
                      <Check className="w-3.5 h-3.5 text-[var(--btn-primary-text)]" strokeWidth={3} />
                    )}
                  </span>
                  <input
                    type="checkbox"
                    checked={agreements[item.key]}
                    onChange={() => toggleAgreement(item.key)}
                    className="sr-only"
                  />
                  <span className="text-xs text-[var(--text-secondary)]">
                    <span
                      className={
                        item.required ? "text-red-400" : "text-[var(--text-muted)]"
                      }
                    >
                      [{item.required ? "필수" : "선택"}]
                    </span>{" "}
                    {item.label}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setOpenModal(item.key)}
                  className="text-xs text-[var(--text-muted)] underline underline-offset-2 hover:text-[var(--text-primary)] transition-colors ml-2"
                >
                  보기
                </button>
              </div>
            ))}

            {agreementError && (
              <p className="text-red-400 text-xs mt-1">{agreementError}</p>
            )}
          </div>

          <div className="pt-4">
            {/* 서버 에러 메시지 (공간 미리 확보) */}
            <div className="min-h-[1.5rem] mb-2">
              {serverError && (
                <p className="text-sm text-red-400 text-center">{serverError}</p>
              )}
            </div>
            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={!requiredChecked}
            >
              회원가입
            </Button>
          </div>
        </form>

        {/* 약관 모달 */}
        {openModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            onClick={() => setOpenModal(null)}
          >
            <div
              className="w-full max-w-lg bg-[#1e1e1e] border border-[var(--border-color)] flex flex-col max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
                <h2 className="text-sm tracking-wider text-[var(--text-primary)]">
                  {AGREEMENT_CONTENTS[openModal].title}
                </h2>
                <button
                  type="button"
                  onClick={() => setOpenModal(null)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  aria-label="닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 py-5 overflow-y-auto overscroll-contain flex-1">
                <pre className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--text-secondary)] font-sans">
                  {AGREEMENT_CONTENTS[openModal].body}
                </pre>
              </div>
              <div className="px-6 py-4 border-t border-[var(--border-color)]">
                <Button
                  type="button"
                  fullWidth
                  onClick={() => setOpenModal(null)}
                >
                  확인
                </Button>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-[var(--text-muted)] mt-8">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/login"
            className="text-[var(--text-primary)] underline underline-offset-4"
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
