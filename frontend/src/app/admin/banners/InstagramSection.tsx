"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminMainPageConfig,
  updateInstagramSection,
  uploadInstagramImage,
} from "@/lib/admin";
import { invalidateMainPageConfigRelated } from "@/lib/queryInvalidator";
import type { InstagramItem } from "@/types";

const EMPTY_ITEMS: InstagramItem[] = Array.from({ length: 3 }, () => ({
  imageUrl: null,
  linkUrl: null,
}));
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface Draft {
  handle: string;
  items: InstagramItem[];
}

function normalizeItems(items?: InstagramItem[]): InstagramItem[] {
  return Array.from({ length: 3 }, (_, index) => ({
    imageUrl: items?.[index]?.imageUrl ?? null,
    linkUrl: items?.[index]?.linkUrl ?? null,
  }));
}

function errorMessage(error: unknown, fallback: string) {
  const response = error as {
    response?: { data?: { message?: string; error?: { message?: string } } };
  };
  return (
    response.response?.data?.error?.message ??
    response.response?.data?.message ??
    fallback
  );
}

export default function InstagramSection() {
  const queryClient = useQueryClient();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin", "mainPageConfig"],
    queryFn: getAdminMainPageConfig,
  });

  const serverDraft: Draft = {
    handle: data?.data?.instagramHandle ?? "",
    items: normalizeItems(data?.data?.instagramItems ?? EMPTY_ITEMS),
  };
  const current = draft ?? serverDraft;

  const updateDraft = (updater: (value: Draft) => Draft) => {
    setDraft(updater({
      handle: current.handle,
      items: current.items.map((item) => ({ ...item })),
    }));
    setSaved(false);
  };

  const mutation = useMutation({
    mutationFn: (value: Draft) =>
      updateInstagramSection(
        value.handle.trim() || null,
        value.items.map((item) => ({
          imageUrl: item.imageUrl,
          linkUrl: item.linkUrl?.trim() || null,
        }))
      ),
    onSuccess: () => {
      invalidateMainPageConfigRelated(queryClient);
      setDraft(null);
      setError("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err) =>
      setError(errorMessage(err, "Instagram 영역 저장에 실패했습니다.")),
  });

  const handleFile = async (index: number, file?: File) => {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError("jpg, jpeg, png, gif, webp 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("이미지는 5MB 이하여야 합니다.");
      return;
    }

    setUploadingIndex(index);
    setError("");
    try {
      const imageUrl = await uploadInstagramImage(file);
      updateDraft((value) => ({
        ...value,
        items: value.items.map((item, itemIndex) =>
          itemIndex === index ? { ...item, imageUrl } : item
        ),
      }));
    } catch (err) {
      setError(errorMessage(err, "이미지 업로드에 실패했습니다."));
    } finally {
      setUploadingIndex(null);
    }
  };

  const configuredCount = current.items.filter(
    (item) => item.imageUrl && item.linkUrl?.trim()
  ).length;
  const canSave =
    configuredCount === 3 &&
    current.handle.trim() !== "" &&
    uploadingIndex === null &&
    !mutation.isPending;

  return (
    <section className="mb-12 border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
      <h2 className="mb-2 text-base font-light tracking-[0.15em] text-[var(--text-primary)]">
        Instagram 영역
      </h2>
      <p className="mb-5 text-xs leading-relaxed text-[var(--text-muted)]">
        메인 페이지 맨 아래에 표시할 이미지 3장과 각 Instagram 게시물 링크를 설정합니다.
      </p>

      <label className="mb-2 block text-xs text-[var(--text-muted)]">
        Instagram 계정명
      </label>
      <div className="mb-6 flex items-center border border-[var(--border-color)] bg-[var(--input-bg)] px-3">
        <span className="text-sm text-[var(--text-muted)]">@</span>
        <input
          value={current.handle.replace(/^@/, "")}
          onChange={(event) =>
            updateDraft((value) => ({
              ...value,
              handle: event.target.value.replace(/^@/, ""),
            }))
          }
          maxLength={100}
          placeholder="pantrka"
          className="w-full bg-transparent px-1 py-2.5 text-sm text-[var(--text-primary)] outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {current.items.map((item, index) => (
          <div key={index}>
            <button
              type="button"
              onClick={() => inputRefs.current[index]?.click()}
              disabled={uploadingIndex !== null}
              className="relative mb-3 flex aspect-square w-full items-center justify-center overflow-hidden bg-[var(--section-bg)] disabled:opacity-60"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={`Instagram ${index + 1} 미리보기`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs text-[var(--text-dim)]">
                  이미지 {index + 1} 선택
                </span>
              )}
              {uploadingIndex === index && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-white">
                  업로드 중...
                </span>
              )}
            </button>
            <input
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(event) => {
                void handleFile(index, event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <label className="mb-2 block text-xs text-[var(--text-muted)]">
              이미지 {index + 1} 링크
            </label>
            <input
              type="url"
              value={item.linkUrl ?? ""}
              onChange={(event) =>
                updateDraft((value) => ({
                  ...value,
                  items: value.items.map((currentItem, itemIndex) =>
                    itemIndex === index
                      ? { ...currentItem, linkUrl: event.target.value }
                      : currentItem
                  ),
                }))
              }
              placeholder="https://www.instagram.com/p/..."
              className="w-full border border-[var(--border-color)] bg-[var(--input-bg)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)]"
            />
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-xs text-red-600">{error}</p>}
      {saved && <p className="mt-4 text-xs text-green-600">저장되었습니다.</p>}
      {configuredCount > 0 && configuredCount < 3 && (
        <p className="mt-4 text-xs text-amber-600">
          공개하려면 이미지와 링크를 3개 모두 입력해주세요.
        </p>
      )}

      <button
        type="button"
        onClick={() => mutation.mutate(current)}
        disabled={!canSave}
        className="mt-5 px-5 py-2 text-xs bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] transition-colors hover:bg-[var(--btn-primary-hover)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {mutation.isPending ? "저장 중..." : "Instagram 영역 저장"}
      </button>
    </section>
  );
}
