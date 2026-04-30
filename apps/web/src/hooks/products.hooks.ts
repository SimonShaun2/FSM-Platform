"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateProductInput,
  ListProductsQuery,
  ProductCategory,
  UpdateProductInput
} from "@fsm/types";

import { api } from "@/src/lib/api";

interface PaginatedResponse<TItem> {
  data: TItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductRecord {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  category: ProductCategory;
  sku: string | null;
  unitPrice: string;
  cost: string | null;
  unit: string | null;
  isTaxable: boolean | null;
  isActive: boolean;
  applicableAssetTypes: string[];
  sortOrder: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProductListRecord extends ProductRecord {
  usedOnJobs: number;
}

export interface ProductRecentJobUsageRecord {
  jobId: string;
  jobNumber: string;
  customerName: string;
  usedAt: string;
  totalRevenue: string;
}

export interface ProductUsageStatsRecord {
  usedOnJobs: number;
  totalRevenue: string;
  averageRevenuePerJob: string;
  lastUsedAt: string | null;
  recentJobs: ProductRecentJobUsageRecord[];
}

interface ProductResponse {
  product: ProductRecord;
  usageStats: ProductUsageStatsRecord;
}

interface ProductMutationResponse {
  product: ProductRecord;
}

interface ProductSearchResponse {
  products: ProductRecord[];
}

const productKeys = {
  all: ["products"] as const,
  list: (query: ListProductsQuery) => ["products", "list", query] as const,
  detail: (productId: string) => ["products", "detail", productId] as const,
  search: (query: string) => ["products", "search", query] as const
};

function buildQueryString(values: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) {
      continue;
    }

    params.set(key, String(value));
  }

  return params.toString();
}

async function invalidateProductQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  productId?: string
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: productKeys.all }),
    queryClient.invalidateQueries({ queryKey: ["jobs", "product-search"] }),
    queryClient.invalidateQueries({ queryKey: ["jobs"] })
  ]);

  if (productId) {
    await queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
  }
}

export function useProducts(query: ListProductsQuery) {
  const queryString = buildQueryString({
    category: query.category,
    isActive: query.isActive,
    search: query.search,
    page: query.page,
    limit: query.limit
  });

  return useQuery({
    queryKey: productKeys.list(query),
    queryFn: () => api.get<PaginatedResponse<ProductListRecord>>(`/api/v1/products?${queryString}`)
  });
}

export function useProduct(productId: string | null) {
  return useQuery({
    queryKey: productId ? productKeys.detail(productId) : productKeys.detail("pending"),
    queryFn: () => api.get<ProductResponse>(`/api/v1/products/${productId}`),
    enabled: Boolean(productId)
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductInput) =>
      api.post<ProductMutationResponse>("/api/v1/products", input),
    onSuccess: async (response) => {
      await invalidateProductQueries(queryClient, response.product.id);
    }
  });
}

export function useUpdateProduct(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProductInput) =>
      api.patch<ProductMutationResponse>(`/api/v1/products/${productId}`, input),
    onSuccess: async () => {
      await invalidateProductQueries(queryClient, productId);
    }
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => api.delete<{ success: boolean }>(`/api/v1/products/${productId}`),
    onSuccess: async (_response, productId) => {
      await invalidateProductQueries(queryClient, productId);
    }
  });
}

export function useProductSearch(query: string) {
  return useQuery({
    queryKey: productKeys.search(query),
    queryFn: () => api.get<ProductSearchResponse>(`/api/v1/products/search?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length >= 2,
    staleTime: 30 * 1000
  });
}
