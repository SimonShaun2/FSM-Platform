import type { ProductCategory } from "./product.types.js";

export interface JobProduct {
  id: string;
  companyId: string;
  jobId: string;
  productCatalogId: string | null;
  name: string;
  description: string | null;
  category: ProductCategory;
  quantity: string;
  unitPrice: string;
  total: string;
  isTaxable: boolean | null;
  addedById: string | null;
  isUpsell: boolean | null;
  upsellApproved: boolean | null;
  upsellApprovedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface AddJobProductInput {
  productCatalogId?: string;
  name?: string;
  description?: string;
  category?: ProductCategory;
  quantity?: number;
  unitPrice?: number;
  isTaxable?: boolean;
  isUpsell?: boolean;
}

export interface UpdateJobProductInput {
  name?: string;
  description?: string;
  category?: ProductCategory;
  quantity?: number;
  unitPrice?: number;
  isTaxable?: boolean;
  isUpsell?: boolean;
}
