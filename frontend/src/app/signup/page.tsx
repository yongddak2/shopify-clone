"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup } from "@/lib/auth";
import Button from "@/components/common/Button";

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

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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

    setLoading(true);
    try {
      await signup(form.email, form.password, form.name, form.phone);
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

          <div className="pt-4">
            {/* 서버 에러 메시지 (공간 미리 확보) */}
            <div className="min-h-[1.5rem] mb-2">
              {serverError && (
                <p className="text-sm text-red-400 text-center">{serverError}</p>
              )}
            </div>
            <Button type="submit" fullWidth loading={loading}>
              회원가입
            </Button>
          </div>
        </form>

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
