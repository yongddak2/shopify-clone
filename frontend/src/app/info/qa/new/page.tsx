"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { createQna, uploadQnaImage } from "@/lib/qna";
import { useAuthStore } from "@/stores/authStore";
import type { SupportCategory } from "@/types";

const CATEGORIES: { value: SupportCategory; label: string }[] = [
  { value: "PRODUCT", label: "상품" },
  { value: "DELIVERY", label: "배송" },
  { value: "EXCHANGE", label: "교환/반품" },
  { value: "PAYMENT", label: "결제" },
  { value: "MEMBER", label: "회원" },
  { value: "ETC", label: "기타" },
];

const MAX_IMAGES = 3;
const ALLOWED_EXT = ["jpg", "jpeg", "png", "gif", "webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function QnaNewPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<SupportCategory>("PRODUCT");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
    }
  }, [isLoggedIn, router]);

  const mutation = useMutation({
    mutationFn: () => createQna({ category, title, content, secret: isSecret, imageUrls }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qnas"] });
      router.push("/info/qa");
    },
    onError: () => setError("등록에 실패했습니다. 입력값을 확인해주세요."),
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError("");
    if (imageUrls.length + files.length > MAX_IMAGES) {
      setError(`이미지는 최대 ${MAX_IMAGES}장까지 첨부 가능합니다.`);
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (file.size > MAX_FILE_SIZE) {
          setError("이미지 크기는 최대 5MB입니다.");
          continue;
        }
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (!ext || !ALLOWED_EXT.includes(ext)) {
          setError("jpg/jpeg/png/gif/webp 형식만 가능합니다.");
          continue;
        }
        const url = await uploadQnaImage(file);
        uploaded.push(url);
      }
      setImageUrls((prev) => [...prev, ...uploaded]);
    } catch {
      setError("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="min-h-[calc(100vh-64px)] px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl tracking-[0.2em] font-light text-center mb-6 text-[var(--text-primary)]">
          문의 작성
        </h1>

        <p className="text-xs text-[var(--text-muted)] text-center leading-relaxed mb-10">
          보통 영업일 기준 1~2일 내 답변 드립니다. (주말·공휴일 제외)<br />
          답변이 등록되면 가입하신 이메일로 안내 메일이 발송됩니다.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
              카테고리
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SupportCategory)}
              className="w-full px-3 py-2 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)]"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="w-full px-3 py-2 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)]"
              placeholder="문의 제목"
            />
          </div>

          <div>
            <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
              내용
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)] resize-y"
              placeholder="문의 내용을 입력해주세요."
            />
          </div>

          <div>
            <label className="block text-xs tracking-wider text-[var(--text-muted)] mb-2">
              이미지 첨부 (최대 {MAX_IMAGES}장)
            </label>
            <div className="flex flex-wrap gap-3 items-start">
              {imageUrls.map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 border border-[var(--border-color)]">
                  <img src={url} alt={`첨부${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-[var(--text-primary)] text-[var(--btn-primary-text)] rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" strokeWidth={2} />
                  </button>
                </div>
              ))}
              {imageUrls.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-20 h-20 border border-dashed border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors text-xs"
                >
                  {uploading ? "업로드 중" : "+ 추가"}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
              <input
                type="checkbox"
                checked={isSecret}
                onChange={(e) => setIsSecret(e.target.checked)}
                className="w-4 h-4"
              />
              비밀글로 등록 (작성자와 관리자만 열람 가능)
            </label>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={mutation.isPending || uploading}
              className="px-6 py-2.5 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? "등록 중..." : "등록"}
            </button>
            <Link
              href="/info/qa"
              className="px-6 py-2.5 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
