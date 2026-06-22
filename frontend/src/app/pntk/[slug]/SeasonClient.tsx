"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getPublicSeasonList, getSeasonBySlug } from "@/lib/season";
import PhotoLightbox from "./PhotoLightbox";

export default function SeasonClient({ slug }: { slug: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: allSeasons = [] } = useQuery({
    queryKey: ["pntk-seasons"],
    queryFn: getPublicSeasonList,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["season", slug],
    queryFn: () => getSeasonBySlug(slug),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] bg-[var(--skeleton)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center gap-4 px-6 py-20">
        <p className="text-sm text-[var(--text-muted)]">
          해당 시즌을 찾을 수 없습니다.
        </p>
        <Link
          href="/"
          className="text-xs tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] underline"
        >
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)]">
      {allSeasons.length > 1 && (
        <nav className="border-b border-[var(--border-color)] px-6 md:px-10 py-5">
          <ul className="flex items-center justify-center flex-wrap gap-x-8 gap-y-3">
            {allSeasons.map((s) => {
              const active = s.slug === slug;
              return (
                <li key={s.id}>
                  <Link
                    href={`/pntk/${s.slug}`}
                    className={`text-xs tracking-[0.2em] whitespace-nowrap transition-colors ${
                      active
                        ? "text-[var(--header-pink-accent)] font-medium border-b-2 border-[var(--header-pink-accent)] pb-1"
                        : "text-[var(--header-pink-accent)] hover:opacity-70"
                    }`}
                  >
                    {s.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      <header className="px-6 md:px-10 py-12 text-center">
        <h1 className="text-2xl md:text-3xl tracking-[0.25em] font-light text-[var(--header-pink-accent)]">
          {data.name}
        </h1>
      </header>

      {data.images.length === 0 ? (
        <div className="py-20 text-center text-sm text-[var(--text-muted)]">
          준비 중입니다.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0">
          {data.images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setLightboxIndex(i)}
              className="aspect-[3/4] bg-[var(--card-bg)] overflow-hidden group"
            >
              <img
                src={img.imageUrl}
                alt=""
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <PhotoLightbox
          images={data.images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
