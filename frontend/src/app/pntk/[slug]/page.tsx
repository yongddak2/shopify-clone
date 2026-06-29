import SeasonClient from "./SeasonClient";
import type { ApiResponse, SeasonDetail, SeasonSummary } from "@/types";

export const dynamic = "force-dynamic";

async function fetchInitial<T>(baseUrl: string, path: string) {
  try {
    const response = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
    if (!response.ok) return undefined;
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return undefined;
  }
}

export default async function PntkSeasonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const baseUrl = process.env.INTERNAL_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    return <SeasonClient slug={slug} />;
  }

  const [initialSeason, initialSeasons] = await Promise.all([
    fetchInitial<SeasonDetail>(
      baseUrl,
      `/api/season-collections/${encodeURIComponent(slug)}`
    ),
    fetchInitial<SeasonSummary[]>(baseUrl, "/api/season-collections"),
  ]);

  return (
    <SeasonClient
      slug={slug}
      initialSeason={initialSeason}
      initialSeasons={initialSeasons}
    />
  );
}
