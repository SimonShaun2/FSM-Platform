"use client";

import { useEffect, useMemo, useState } from "react";
import { Info, Trash2 } from "lucide-react";
import type { ProductCategory } from "@fsm/types";

import type { ProductRecord } from "@/src/hooks/products.hooks";
import {
  useCreateProduct,
  useDeleteProduct,
  useProduct,
  useUpdateProduct
} from "@/src/hooks/products.hooks";
import { ApiError } from "@/src/lib/api";
import { showToast } from "@/src/stores/toast.store";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { Sheet } from "@/src/components/ui/Sheet";
import {
  Field,
  FormError,
  SelectInput,
  TextArea,
  TextInput
} from "@/src/components/customers/form-controls";

import { ProductUsageStats } from "./ProductUsageStats";

const CATEGORY_OPTIONS: Array<{ value: ProductCategory; label: string }> = [
  { value: "service", label: "Service" },
  { value: "labor", label: "Labor" },
  { value: "material", label: "Material" },
  { value: "equipment", label: "Equipment" },
  { value: "fee", label: "Fee" },
  { value: "bundle", label: "Bundle" }
];

const UNIT_OPTIONS = [
  { value: "each", label: "Each" },
  { value: "hour", label: "Hour" },
  { value: "lb", label: "lb" },
  { value: "sqft", label: "sqft" },
  { value: "linear ft", label: "linear ft" },
  { value: "gallon", label: "Gallon" },
  { value: "custom", label: "Custom" }
] as const;

const ASSET_TYPE_OPTIONS = [
  "HVAC",
  "Water Heater",
  "Air Handler",
  "Condenser",
  "Electrical",
  "Plumbing"
] as const;

type AssetTypeOption = (typeof ASSET_TYPE_OPTIONS)[number];
type UnitOptionValue = (typeof UNIT_OPTIONS)[number]["value"];

interface ProductFormProps {
  open: boolean;
  mode: "create" | "edit";
  productId?: string;
  canWrite: boolean;
  onClose: () => void;
}

interface ProductFormState {
  name: string;
  description: string;
  category: ProductCategory;
  sku: string;
  unitPreset: UnitOptionValue;
  customUnit: string;
  unitPrice: string;
  cost: string;
  isTaxable: boolean;
  applicableAssetTypes: AssetTypeOption[];
  isActive: boolean;
}

function normalizeApplicableAssetTypes(
  values: string[] | null | undefined
): AssetTypeOption[] {
  return (values ?? []).filter((value): value is AssetTypeOption =>
    ASSET_TYPE_OPTIONS.some((option) => option === value)
  );
}

function resolveUnitState(unit: string | null | undefined) {
  const normalizedUnit = unit?.trim();

  if (!normalizedUnit) {
    return {
      unitPreset: "each" as UnitOptionValue,
      customUnit: ""
    };
  }

  const matchingOption = UNIT_OPTIONS.find((option) => option.value === normalizedUnit);

  if (matchingOption && matchingOption.value !== "custom") {
    return {
      unitPreset: matchingOption.value,
      customUnit: ""
    };
  }

  return {
    unitPreset: "custom" as UnitOptionValue,
    customUnit: normalizedUnit
  };
}

function buildFormState(product?: ProductRecord | null): ProductFormState {
  const unitState = resolveUnitState(product?.unit);

  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    category: product?.category ?? "service",
    sku: product?.sku ?? "",
    unitPreset: unitState.unitPreset,
    customUnit: unitState.customUnit,
    unitPrice: product?.unitPrice ?? "",
    cost: product?.cost ?? "",
    isTaxable: product?.isTaxable ?? true,
    applicableAssetTypes: normalizeApplicableAssetTypes(product?.applicableAssetTypes),
    isActive: product?.isActive ?? true
  };
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
  disabled = false
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[26px] border border-neutral-200 bg-neutral-50 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-neutral-900">{label}</p>
        <p className="mt-1 text-xs text-neutral-500">{description}</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 rounded-full transition ${
          checked ? "bg-success" : "bg-neutral-300"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export function ProductForm({
  open,
  mode,
  productId,
  canWrite,
  onClose
}: ProductFormProps) {
  const productQuery = useProduct(mode === "edit" ? productId ?? null : null);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct(productId ?? "pending");
  const deleteProduct = useDeleteProduct();

  const [formState, setFormState] = useState<ProductFormState>(() => buildFormState());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deleteOpen, setDeleteOpen] = useState(false);

  const product = productQuery.data?.product ?? null;
  const usageStats = productQuery.data?.usageStats ?? null;

  useEffect(() => {
    if (!open) {
      return;
    }

    setFieldErrors({});

    if (mode === "create") {
      setFormState(buildFormState());
      return;
    }

    if (product) {
      setFormState(buildFormState(product));
    }
  }, [mode, open, product]);

  const mutationError = useMemo(() => {
    if (createProduct.error instanceof ApiError) {
      return createProduct.error.message;
    }

    if (updateProduct.error instanceof ApiError) {
      return updateProduct.error.message;
    }

    if (deleteProduct.error instanceof ApiError) {
      return deleteProduct.error.message;
    }

    return null;
  }, [createProduct.error, deleteProduct.error, updateProduct.error]);

  const editLoadError =
    mode === "edit" && productQuery.isError
      ? productQuery.error instanceof ApiError
        ? productQuery.error.message
        : "Product details could not be loaded."
      : null;

  const isReadOnly = !canWrite || Boolean(editLoadError);

  function updateField<TKey extends keyof ProductFormState>(
    key: TKey,
    value: ProductFormState[TKey]
  ) {
    setFormState((current) => ({
      ...current,
      [key]: value
    }));

    setFieldErrors((current) => {
      if (!(key in current)) {
        return current;
      }

      const next = { ...current };
      delete next[key as string];
      return next;
    });
  }

  function toggleAssetType(assetType: AssetTypeOption) {
    const hasAssetType = formState.applicableAssetTypes.includes(assetType);

    updateField(
      "applicableAssetTypes",
      hasAssetType
        ? formState.applicableAssetTypes.filter((value) => value !== assetType)
        : [...formState.applicableAssetTypes, assetType]
    );
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    if (!formState.name.trim()) {
      nextErrors.name = "Product name is required.";
    }

    const parsedUnitPrice = Number.parseFloat(formState.unitPrice);
    if (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice < 0) {
      nextErrors.unitPrice = "Enter a valid price.";
    }

    if (formState.cost.trim()) {
      const parsedCost = Number.parseFloat(formState.cost);
      if (!Number.isFinite(parsedCost) || parsedCost < 0) {
        nextErrors.cost = "Enter a valid cost.";
      }
    }

    if (formState.unitPreset === "custom" && !formState.customUnit.trim()) {
      nextErrors.customUnit = "Enter a custom unit label.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!canWrite || !validateForm()) {
      return;
    }

    const unitValue =
      formState.unitPreset === "custom" ? formState.customUnit.trim() : formState.unitPreset.trim();

    const payload = {
      name: formState.name.trim(),
      category: formState.category,
      unitPrice: Number.parseFloat(formState.unitPrice),
      isTaxable: formState.isTaxable,
      isActive: formState.isActive,
      applicableAssetTypes: formState.applicableAssetTypes,
      ...(formState.description.trim() ? { description: formState.description.trim() } : {}),
      ...(formState.sku.trim() ? { sku: formState.sku.trim() } : {}),
      ...(unitValue ? { unit: unitValue } : {}),
      ...(formState.cost.trim() ? { cost: Number.parseFloat(formState.cost) } : {})
    };

    try {
      if (mode === "edit" && productId) {
        await updateProduct.mutateAsync(payload);
        showToast({
          tone: "success",
          title: "Product updated",
          description: `${formState.name.trim()} is ready for the team to use.`
        });
      } else {
        await createProduct.mutateAsync(payload);
        showToast({
          tone: "success",
          title: "Product added",
          description: `${formState.name.trim()} is now available in the catalog.`
        });
      }

      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.payload.fields) {
        setFieldErrors(error.payload.fields);
      }
    }
  }

  async function handleDelete() {
    if (!productId || !canWrite) {
      return;
    }

    try {
      await deleteProduct.mutateAsync(productId);
      showToast({
        tone: "success",
        title: "Product archived",
        description: product?.name
          ? `${product.name} was removed from the active catalog.`
          : "Product removed."
      });
      setDeleteOpen(false);
      onClose();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Product could not be deleted",
        description: error instanceof Error ? error.message : "Try again."
      });
    }
  }

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title={mode === "edit" ? "Edit Product" : "Add Product"}
        description={
          mode === "edit"
            ? "Update pricing, availability, and upsell hints without leaving the catalog."
            : "Create a reusable service, labor rate, material, or bundle for jobs and estimates."
        }
        className={mode === "edit" ? "max-w-[960px]" : "max-w-[760px]"}
      >
        <div
          className={`grid min-h-full gap-0 ${
            mode === "edit" ? "xl:grid-cols-[minmax(0,1fr)_300px]" : ""
          }`}
        >
          <div className="flex min-h-full flex-col">
            {mode === "edit" && productQuery.isLoading ? (
              <div className="px-6 py-6">
                <div className="space-y-4">
                  <div className="h-12 rounded-[24px] bg-neutral-100" />
                  <div className="h-24 rounded-[24px] bg-neutral-100" />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="h-12 rounded-[24px] bg-neutral-100" />
                    <div className="h-12 rounded-[24px] bg-neutral-100" />
                  </div>
                  <div className="h-56 rounded-[24px] bg-neutral-100" />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-5 px-6 py-6">
                  <FormError message={mutationError} />
                  <FormError message={editLoadError} />

                  <Field label="Product Name" error={fieldErrors.name}>
                    <TextInput
                      value={formState.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      placeholder="HVAC Diagnostic"
                      disabled={isReadOnly}
                    />
                  </Field>

                  <Field label="Description" error={fieldErrors.description}>
                    <TextArea
                      value={formState.description}
                      onChange={(event) => updateField("description", event.target.value)}
                      placeholder="Short internal summary that helps the team pick the right item fast."
                      disabled={isReadOnly}
                    />
                  </Field>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Category" error={fieldErrors.category}>
                      <SelectInput
                        value={formState.category}
                        onChange={(event) =>
                          updateField("category", event.target.value as ProductCategory)
                        }
                        disabled={isReadOnly}
                      >
                        {CATEGORY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>

                    <Field label="SKU / Code" error={fieldErrors.sku}>
                      <TextInput
                        value={formState.sku}
                        onChange={(event) => updateField("sku", event.target.value)}
                        placeholder="SVC-001"
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Unit" error={fieldErrors.unit || fieldErrors.customUnit}>
                      <div className="space-y-3">
                        <SelectInput
                          value={formState.unitPreset}
                          onChange={(event) =>
                            updateField("unitPreset", event.target.value as UnitOptionValue)
                          }
                          disabled={isReadOnly}
                        >
                          {UNIT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </SelectInput>
                        {formState.unitPreset === "custom" ? (
                          <TextInput
                            value={formState.customUnit}
                            onChange={(event) => updateField("customUnit", event.target.value)}
                            placeholder="visit"
                            disabled={isReadOnly}
                          />
                        ) : null}
                      </div>
                    </Field>

                    <Field label="Unit Price" error={fieldErrors.unitPrice}>
                      <TextInput
                        type="number"
                        step="0.01"
                        min="0"
                        value={formState.unitPrice}
                        onChange={(event) => updateField("unitPrice", event.target.value)}
                        placeholder="95.00"
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>

                  <Field
                    label="Cost"
                    hint="Used for job costing only - never shown to customers."
                    error={fieldErrors.cost}
                  >
                    <div className="relative">
                      <TextInput
                        type="number"
                        step="0.01"
                        min="0"
                        value={formState.cost}
                        onChange={(event) => updateField("cost", event.target.value)}
                        placeholder="Leave blank if not tracked"
                        disabled={isReadOnly}
                        className="pr-11"
                      />
                      <span
                        title="Used for job costing - not shown to customers"
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400"
                      >
                        <Info className="h-4 w-4" />
                      </span>
                    </div>
                  </Field>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-700">
                        Applicable Asset Types
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        Products here surface more naturally in upsell and estimate workflows.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ASSET_TYPE_OPTIONS.map((assetType) => {
                        const selected = formState.applicableAssetTypes.includes(assetType);

                        return (
                          <button
                            key={assetType}
                            type="button"
                            disabled={isReadOnly}
                            onClick={() => toggleAssetType(assetType)}
                            className={
                              selected
                                ? "rounded-full bg-brand-accent-light px-4 py-2 text-sm font-semibold text-brand-accent disabled:cursor-not-allowed disabled:opacity-60"
                                : "rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
                            }
                          >
                            {assetType}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <ToggleField
                      label="Taxable"
                      description="Include this item in tax calculations by default."
                      checked={formState.isTaxable}
                      onChange={(checked) => updateField("isTaxable", checked)}
                      disabled={isReadOnly}
                    />
                    <ToggleField
                      label="Active"
                      description="Visible in estimates and job product pickers."
                      checked={formState.isActive}
                      onChange={(checked) => updateField("isActive", checked)}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-neutral-200 px-6 py-5">
                  <div>
                    {mode === "edit" && canWrite && !editLoadError ? (
                      <button
                        type="button"
                        onClick={() => setDeleteOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-error/20 px-4 py-2 text-sm font-semibold text-error transition hover:bg-error-light"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Product
                      </button>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600"
                    >
                      Cancel
                    </button>
                    {canWrite ? (
                      <button
                        type="button"
                        disabled={
                          Boolean(editLoadError) ||
                          createProduct.isPending ||
                          updateProduct.isPending ||
                          deleteProduct.isPending
                        }
                        onClick={() => {
                          void handleSubmit();
                        }}
                        className="rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {createProduct.isPending || updateProduct.isPending
                          ? "Saving..."
                          : "Save Product"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </div>

          {mode === "edit" ? (
            <aside className="border-t border-neutral-200 bg-neutral-50 px-5 py-5 xl:border-l xl:border-t-0">
              <ProductUsageStats stats={usageStats} isLoading={productQuery.isLoading} />
            </aside>
          ) : null}
        </div>
      </Sheet>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this product?"
        description="This archives the product from the active catalog. If it is still attached to active jobs, the delete will be blocked."
        confirmLabel="Delete product"
        confirmTone="danger"
        isPending={deleteProduct.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          void handleDelete();
        }}
      />
    </>
  );
}
