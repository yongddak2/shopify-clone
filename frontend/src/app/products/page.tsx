import ProductsContent, { ProductsPageFallback } from "./ProductsContent";
import type { ApiResponse, Category, PageResponse, Product } from "@/types";

export const dynamic = "force-dynamic";

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    sort?: string;
  }>;
}

async function getInitialData(searchParams: Awaited<ProductsPageProps["searchParams"]>) {
  const baseUrl = process.env.INTERNAL_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) return {};

  try {
    const categoriesResponse = await fetch(`${baseUrl}/api/categories`, {
      cache: "no-store",
    });
    if (!categoriesResponse.ok) return {};

    const categories = (await categoriesResponse.json()) as ApiResponse<Category[]>;
    const categoryId = categories.data?.find(
      (category) => category.name === searchParams.category
    )?.id;
    const params = new URLSearchParams({ page: "0", size: "12" });
    if (categoryId !== undefined) params.set("categoryId", String(categoryId));
    if (searchParams.sort) params.set("sort", searchParams.sort);

    const productsResponse = await fetch(`${baseUrl}/api/products?${params}`, {
      cache: "no-store",
    });
    if (!productsResponse.ok) return { initialCategories: categories };

    const products = (await productsResponse.json()) as ApiResponse<PageResponse<Product>>;
    return { initialCategories: categories, initialProducts: products };
  } catch {
    return {};
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = await searchParams;
  const initialData = await getInitialData(resolvedSearchParams);

  return (
    <ProductsPageFallback>
      <ProductsContent {...initialData} />
    </ProductsPageFallback>
  );
}
