"use client";

import { useCallback, useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { SeasonImage } from "@/types";

export default function PhotoLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: SeasonImage[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);
  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);
    // 배경 스크롤 잠금
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, goPrev, goNext]);

  const current = images[index];
  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 p-2 text-white hover:text-white/70 transition-colors"
        aria-label="닫기"
      >
        <X className="w-6 h-6" strokeWidth={1.5} />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-4 md:left-8 p-3 text-white hover:text-white/70 transition-colors"
            aria-label="이전 사진"
          >
            <ChevronLeft className="w-7 h-7" strokeWidth={1.5} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-4 md:right-8 p-3 text-white hover:text-white/70 transition-colors"
            aria-label="다음 사진"
          >
            <ChevronRight className="w-7 h-7" strokeWidth={1.5} />
          </button>
        </>
      )}

      <img
        src={current.imageUrl}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-w-[90vw] max-h-[90vh] object-contain"
      />

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-xs tracking-[0.2em]">
        {index + 1} / {images.length}
      </div>
    </div>
  );
}
