"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getPublicSeasonList } from "@/lib/season";

export default function PntkIndexPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["pntk-seasons"],
    queryFn: getPublicSeasonList,
  });

  useEffect(() => {
    if (data && data.length > 0) {
      router.replace(`/pntk/${data[0].slug}`);
    }
  }, [data, router]);

  if (isLoading || (data && data.length > 0)) {
    return (
      <div className="min-h-[calc(100vh-64px)] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] bg-[var(--skeleton)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError || !data || data.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center gap-4 px-6 py-20">
        <p className="text-sm text-[var(--text-muted)]">
          공개된 시즌 컬렉션이 아직 없습니다.
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

  return null;
}
