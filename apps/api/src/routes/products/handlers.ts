import type { FastifyReply, FastifyRequest } from "fastify";

import type {
  CreateProductInput,
  ListProductsQuery,
  Product,
  UpdateProductInput
} from "@fsm/types";

import {
  createProduct,
  deleteProduct,
  getProduct,
  getProductUsageStats,
  listProducts,
  listProductUsageCounts,
  searchProducts,
  updateProduct
} from "../../services/product-catalog.service.js";
import type {
  ProductIdParams,
  SearchProductsQuery
} from "./schemas.js";

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function toProductResponse(product: Product) {
  return {
    id: product.id,
    companyId: product.companyId,
    name: product.name,
    description: product.description,
    category: product.category,
    sku: product.sku,
    unitPrice: product.unitPrice,
    cost: product.cost,
    unit: product.unit,
    isTaxable: product.isTaxable,
    isActive: product.isActive,
    applicableAssetTypes: product.applicableAssetTypes ?? [],
    sortOrder: product.sortOrder,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    deletedAt: toIsoString(product.deletedAt)
  };
}

function toProductListItemResponse(product: Product, usedOnJobs: number) {
  return {
    ...toProductResponse(product),
    usedOnJobs
  };
}

function toProductUsageStatsResponse(
  usageStats: Awaited<ReturnType<typeof getProductUsageStats>>
) {
  return {
    usedOnJobs: usageStats.usedOnJobs,
    totalRevenue: usageStats.totalRevenue,
    averageRevenuePerJob: usageStats.averageRevenuePerJob,
    lastUsedAt: toIsoString(usageStats.lastUsedAt),
    recentJobs: usageStats.recentJobs.map((job) => ({
      jobId: job.jobId,
      jobNumber: job.jobNumber,
      customerName: job.customerName,
      usedAt: job.usedAt.toISOString(),
      totalRevenue: job.totalRevenue
    }))
  };
}

export async function listProductsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const [result, usageCounts] = await Promise.all([
    listProducts(request.company.id, request.query as ListProductsQuery),
    listProductUsageCounts(request.company.id)
  ]);

  return reply.send({
    data: result.data.map((product) => toProductListItemResponse(product, usageCounts.get(product.id) ?? 0)),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages
  });
}

export async function searchProductsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const query = request.query as SearchProductsQuery;
  const products = await searchProducts(request.company.id, query.q);

  return reply.send({
    products: products.map((product) => toProductResponse(product))
  });
}

export async function createProductHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const product = await createProduct(
    request.company.id,
    request.user.id,
    request.body as CreateProductInput
  );

  return reply.status(201).send({
    product: toProductResponse(product)
  });
}

export async function getProductHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as ProductIdParams;
  const [product, usageStats] = await Promise.all([
    getProduct(request.company.id, params.id),
    getProductUsageStats(request.company.id, params.id)
  ]);

  return reply.send({
    product: toProductResponse(product),
    usageStats: toProductUsageStatsResponse(usageStats)
  });
}

export async function updateProductHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as ProductIdParams;
  const product = await updateProduct(
    request.company.id,
    request.user.id,
    params.id,
    request.body as UpdateProductInput
  );

  return reply.send({
    product: toProductResponse(product)
  });
}

export async function deleteProductHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as ProductIdParams;
  await deleteProduct(request.company.id, request.user.id, params.id);

  return reply.send({
    success: true
  });
}
