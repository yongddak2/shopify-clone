import api from "./api";
import type {
  ApiResponse,
  PageResponse,
  Product,
  ProductDetail,
  Category,
} from "@/types";

interface ProductParams {
  page?: number;
  size?: number;
  categoryId?: number;
  sort?: string;
}

export async function getProducts(params: ProductParams = {}) {
  const res = await api.get<ApiResponse<PageResponse<Product>>>(
    "/api/products",
    { params }
  );
  return res.data;
}

export async function getProductDetail(id: number) {
  const res = await api.get<ApiResponse<ProductDetail>>(
    `/api/products/${id}`
  );
  return res.data;
}

export async function getCategories() {
  const res = await api.get<ApiResponse<Category[]>>("/api/categories");
  return res.data;
}

interface SearchParams {
  keyword: string;
  category?: number;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
  sort?: string;
}

export async function searchProducts(params: SearchParams) {
  const res = await api.get<ApiResponse<PageResponse<Product>>>(
    "/api/products/search",
    { params }
  );
  return res.data;
}
