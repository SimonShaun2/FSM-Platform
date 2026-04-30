"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Package, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ProductCategory } from "@fsm/types";

import { PageLayout } from "@/src/components/layout/PageLayout";
import { CurrencyDisplay } from "@/src/components/ui/CurrencyDisplay";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import { StatBadge } from "@/src/components/ui/StatBadge";
import { useProducts, type ProductListRecord } from "@/src/hooks/products.hooks";
import { getStoredSession } from "@/src/lib/auth";
import { cn } from "@/src/lib/utils";
import { useAuthStore } from "@/src/stores/auth.store";
import { showToast } from "@/src/stores/toast.store";

import { ProductForm } from "./ProductForm";

const PAGE_SIZE = 25;

const CATEGORY_TABS: Array<{ value: "all" | ProductCategory; label: string }> = [
  { value: "all", label: "All" },
  { value: "service", label: "Service" },
  { value: "labor", label: "Labor" },
  { value: "material", label: "Material" },
  { value: "equipment", label: "Equipment" },
  { value: "fee", label: "Fee" },
  { value: "bundle", label: "Bundle" }
];

type ProductSortKey =
  | "name"
  | "category"
  | "sku"
  | "unit"
  | "unitPrice"
  | "isTaxable"
  | "usedOnJobs";

type SortDirection = "asc" | "desc";

interface ProductCatalogClientProps {
  editor?:
    | {
        mode: "create";
      }
    | {
        mode: "edit";
        productId: string;
      };
}

function getCategoryTone(category: ProductCategory) {
  switch (category) {
    case "service":
      return "blue" as const;
    case "labor":
      return "purple" as const;
    case "material":
      return "orange" as const;
    case "equipment":
      return "green" as const;
    case "fee":
      return "gray" as const;
    case "bundle":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}

function sortProducts(
  products: ProductListRecord[],
  sortKey: ProductSortKey,
  direction: SortDirection
) {
  const directionMultiplier = direction === "asc" ? 1 : -1;

  return [...products].sort((left, right) => {
    let comparison = 0;

    switch (sortKey) {
      case "category":
        comparison = left.category.localeCompare(right.category);
        break;
      case "sku":
        comparison = (left.sku ?? "").localeCompare(right.sku ?? "");
        break;
      case "unit":
        comparison = (left.unit ?? "").localeCompare(right.unit ?? "");
        break;
      case "unitPrice":
        comparison = Number(left.unitPrice) - Number(right.unitPrice);
        break;
      case "isTaxable":
        comparison = Number(left.isTaxable ?? false) - Number(right.isTaxable ?? false);
        break;
      case "usedOnJobs":
        comparison = left.usedOnJobs - right.usedOnJobs;
        break;
      case "name":
      default:
        comparison = left.name.localeCompare(right.name);
        break;
    }

    if (comparison === 0) {
      comparison = left.name.localeCompare(right.name);
    }

    return comparison * directionMultiplier;
  });
}

function ActiveOnlyToggle({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
    >
      <span>Active Only</span>
      <span
        className={cn(
          "relative inline-flex h-6 w-11 rounded-full transition",
          checked ? "bg-success" : "bg-neutral-300"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition",
            checked ? "left-5" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}

function SortableHeader({
  label,
  sortKey,
  activeSort,
  direction,
  onSort
}: {
  label: string;
  sortKey: ProductSortKey;
  activeSort: ProductSortKey;
  direction: SortDirection;
  onSort: (sortKey: ProductSortKey) => void;
}) {
  const isActive = activeSort === sortKey;

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-2 font-semibold text-neutral-500 transition hover:text-neutral-800"
    >
      <span>{label}</span>
      <ArrowUpDown
        className={cn(
          "h-3.5 w-3.5",
          isActive ? "text-brand-accent" : "text-neutral-300"
        )}
      />
      {isActive ? (
        <span className="text-[10px] uppercase tracking-[0.18em] text-brand-accent">
          {direction}
        </span>
      ) : null}
    </button>
  );
}

function ProductCatalogActions({
  canWrite,
  onAddProduct
}: {
  canWrite: boolean;
  onAddProduct: () => void;
}) {
  if (!canWrite) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onAddProduct}
      className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary"
    >
      <Plus className="h-4 w-4" />
      Add Product
    </button>
  );
}

export function ProductCatalogClient({ editor }: ProductCatalogClientProps) {
  const router = useRouter();
  const authUser = useAuthStore((state) => state.user);
  const [category, setCategory] = useState<"all" | ProductCategory>("all");
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const [sortKey, setSortKey] = useState<ProductSortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);

  const fallbackSession = useMemo(() => (authUser ? null : getStoredSession()), [authUser]);
  const role = authUser?.role ?? fallbackSession?.role ?? null;
  const canWrite = role === "owner" || role === "admin";

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchDraft.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchDraft]);

  useEffect(() => {
    setPage(1);
  }, [activeOnly, category, search, sortDirection, sortKey]);

  const productsQuery = useProducts({
    ...(category !== "all" ? { category } : {}),
    ...(search ? { search } : {}),
    ...(activeOnly ? { isActive: true } : {}),
    page: 1,
    limit: 100
  });

  const sortedProducts = useMemo(
    () => sortProducts(productsQuery.data?.data ?? [], sortKey, sortDirection),
    [productsQuery.data?.data, sortDirection, sortKey]
  );
  const pageCount = Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE));
  const visibleProducts = sortedProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  function handleSort(nextSortKey: ProductSortKey) {
    if (sortKey === nextSortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection(
      nextSortKey === "usedOnJobs" || nextSortKey === "unitPrice" ? "desc" : "asc"
    );
  }

  function openCreateForm() {
    if (!canWrite) {
      showToast({
        tone: "error",
        title: "Catalog editing is restricted",
        description: "Only owners and admins can add or edit products."
      });
      return;
    }

    router.push("/products/new");
  }

  function openEditForm(productId: string) {
    if (!canWrite) {
      showToast({
        tone: "error",
        title: "Catalog editing is restricted",
        description: "Only owners and admins can add or edit products."
      });
      return;
    }

    router.push(`/products/${productId}`);
  }

  function closeEditor() {
    router.push("/products");
  }

  const editorSheet = editor ? (
    <ProductForm
      open
      mode={editor.mode}
      {...(editor.mode === "edit" ? { productId: editor.productId } : {})}
      canWrite={canWrite}
      onClose={closeEditor}
    />
  ) : null;

  if (productsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-[110px]" />
        <SkeletonCard className="h-[640px]" />
      </div>
    );
  }

  if (productsQuery.isError) {
    return (
      <>
        <PageLayout
          title="Product Catalog"
          subtitle="Services, labor, and materials your team uses across jobs, quotes, and invoices."
          actions={<ProductCatalogActions canWrite={canWrite} onAddProduct={openCreateForm} />}
        >
          <section className="surface-card px-5 py-12">
            <EmptyState
              icon={Package}
              title="Catalog unavailable"
              subtitle="Products could not be loaded right now. Refresh and try again."
            />
          </section>
        </PageLayout>

        {editorSheet}
      </>
    );
  }

  return (
    <>
      <PageLayout
        title="Product Catalog"
        subtitle="Services, labor, and materials your team uses across jobs, quotes, and invoices."
        actions={<ProductCatalogActions canWrite={canWrite} onAddProduct={openCreateForm} />}
      >
        <section className="surface-card overflow-hidden">
          <div className="border-b border-neutral-200 px-5 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {CATEGORY_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setCategory(tab.value)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition",
                      category === tab.value
                        ? "bg-brand-accent text-white"
                        : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <label className="flex min-w-0 items-center gap-3 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-3 lg:w-[300px]">
                  <Search className="h-4 w-4 text-neutral-400" />
                  <input
                    value={searchDraft}
                    onChange={(event) => setSearchDraft(event.target.value)}
                    placeholder="Search products..."
                    className="min-w-0 flex-1 bg-transparent text-sm text-neutral-700 outline-none placeholder:text-neutral-400"
                  />
                </label>

                <ActiveOnlyToggle checked={activeOnly} onChange={setActiveOnly} />
              </div>
            </div>
          </div>

          {visibleProducts.length === 0 ? (
            <div className="px-5 py-12">
              <EmptyState
                icon={Package}
                title="No products match this view"
                subtitle="Try a different category or widen the search to surface more catalog items."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-[0.18em] text-neutral-400">
                  <tr>
                    <th className="px-5 py-4">
                      <SortableHeader
                        label="Name"
                        sortKey="name"
                        activeSort={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-5 py-4">
                      <SortableHeader
                        label="Category"
                        sortKey="category"
                        activeSort={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-5 py-4">
                      <SortableHeader
                        label="SKU"
                        sortKey="sku"
                        activeSort={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-5 py-4">
                      <SortableHeader
                        label="Unit"
                        sortKey="unit"
                        activeSort={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-5 py-4">
                      <SortableHeader
                        label="Unit Price"
                        sortKey="unitPrice"
                        activeSort={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-5 py-4">
                      <SortableHeader
                        label="Taxable"
                        sortKey="isTaxable"
                        activeSort={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-5 py-4">
                      <SortableHeader
                        label="Used on Jobs"
                        sortKey="usedOnJobs"
                        activeSort={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    {canWrite ? <th className="px-5 py-4 text-right">Action</th> : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {visibleProducts.map((product) => (
                    <tr key={product.id} className="transition hover:bg-brand-accent-light/30">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-neutral-900">{product.name}</p>
                          {product.description ? (
                            <p className="mt-1 max-w-[320px] truncate text-xs text-neutral-500">
                              {product.description}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatBadge
                          label={product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                          tone={getCategoryTone(product.category)}
                        />
                      </td>
                      <td className="px-5 py-4 text-neutral-600">{product.sku ?? "--"}</td>
                      <td className="px-5 py-4 text-neutral-600">{product.unit ?? "--"}</td>
                      <td className="px-5 py-4 font-semibold text-neutral-900">
                        <CurrencyDisplay value={product.unitPrice} showCents />
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 text-sm text-neutral-600">
                          <span
                            className={cn(
                              "h-2.5 w-2.5 rounded-full",
                              product.isTaxable ? "bg-success" : "bg-neutral-300"
                            )}
                          />
                          {product.isTaxable ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium text-neutral-700">
                        {product.usedOnJobs}
                      </td>
                      {canWrite ? (
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openEditForm(product.id)}
                            className="inline-flex rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-brand-accent transition hover:bg-brand-accent-light"
                          >
                            Edit details
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4 text-sm text-neutral-500">
            <p>
              Showing {visibleProducts.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-
              {Math.min(page * PAGE_SIZE, sortedProducts.length)} of {sortedProducts.length}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-full border border-neutral-200 px-4 py-2 font-semibold text-neutral-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-3 text-neutral-400">
                Page {page} of {pageCount}
              </span>
              <button
                type="button"
                disabled={page >= pageCount}
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                className="rounded-full border border-neutral-200 px-4 py-2 font-semibold text-neutral-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </PageLayout>

      {editorSheet}
    </>
  );
}
