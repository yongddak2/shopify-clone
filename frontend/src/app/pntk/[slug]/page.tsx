import SeasonClient from "./SeasonClient";

export default async function PntkSeasonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <SeasonClient slug={slug} />;
}
