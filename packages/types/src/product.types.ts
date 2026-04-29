export type ProductCategory = "service" | "labor" | "material" | "equipment" | "fee" | "bundle";

export interface Product {
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
  applicableAssetTypes: string[] | null;
  sortOrder: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  category?: ProductCategory;
  sku?: string;
  unitPrice: number;
  cost?: number;
  unit?: string;
  isTaxable?: boolean;
  isActive?: boolean;
  applicableAssetTypes?: string[];
  sortOrder?: number;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  category?: ProductCategory;
  sku?: string;
  unitPrice?: number;
  cost?: number;
  unit?: string;
  isTaxable?: boolean;
  isActive?: boolean;
  applicableAssetTypes?: string[];
  sortOrder?: number;
}

export interface ListProductsQuery {
  category?: ProductCategory;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}
