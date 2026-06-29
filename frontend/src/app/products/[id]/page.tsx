import ProductDetailClient from "./ProductDetailClient";
import type { ApiResponse, ProductDetail } from "@/types";

export const dynamic = "force-dynamic";

async function getInitialProduct(id: string) {
  if (!/^\d+$/.test(id)) return undefined;

  const baseUrl =
    process.env.INTERNAL_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) return undefined;

  try {
    const response = await fetch(`${baseUrl}/api/products/${id}`, {
      cache: "no-store",
    });
    if (!response.ok) return undefined;
    return (await response.json()) as ApiResponse<ProductDetail>;
  } catch {
    return undefined;
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initialProduct = await getInitialProduct(id);

  return <ProductDetailClient id={id} initialProduct={initialProduct} />;
}
