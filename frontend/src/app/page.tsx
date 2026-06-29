import HomeContent from "./HomeContent";
import type {
  ApiResponse,
  Banner,
  MainPageConfig,
  PageResponse,
  Product,
} from "@/types";

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

export default async function Home() {
  const baseUrl = process.env.INTERNAL_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) return <HomeContent />;

  const [
    initialBanners,
    initialConfig,
    initialCuratedNewArrivals,
    initialBestProducts,
  ] = await Promise.all([
    fetchInitial<Banner[]>(baseUrl, "/api/banners"),
    fetchInitial<MainPageConfig>(baseUrl, "/api/main-page-config"),
    fetchInitial<Product[]>(baseUrl, "/api/main-page/new-arrivals"),
    fetchInitial<PageResponse<Product>>(
      baseUrl,
      "/api/products?page=0&size=4&sort=sales"
    ),
  ]);

  return (
    <HomeContent
      initialBanners={initialBanners}
      initialConfig={initialConfig}
      initialCuratedNewArrivals={initialCuratedNewArrivals}
      initialBestProducts={initialBestProducts}
    />
  );
}
