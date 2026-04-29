"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useCreateAsset, useUpdateAsset, type AssetRecord } from "@/src/hooks/customers.hooks";
import { ApiError } from "@/src/lib/api";

import { buildAssetName } from "./customers.utils";
import { Field, FormError, SelectInput, TextArea, TextInput } from "./form-controls";
import { Sheet } from "../ui/Sheet";

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const assetFormSchema = z.object({
  assetType: z.string().trim().min(1, "Asset type is required"),
  brand: z.string().trim().optional(),
  model: z.string().trim().optional(),
  serialNumber: z.string().trim().optional(),
  installDate: z.string().regex(isoDatePattern, "Use YYYY-MM-DD").optional().or(z.literal("")),
  warrantyExpiration: z.string().regex(isoDatePattern, "Use YYYY-MM-DD").optional().or(z.literal("")),
  condition: z.enum(["excellent", "good", "fair", "poor", "failed"]),
  conditionNotes: z.string().trim().optional(),
  notes: z.string().trim().optional()
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

interface AssetFormProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  propertyId: string;
  asset?: AssetRecord | null;
}

function buildDefaults(asset?: AssetRecord | null): AssetFormValues {
  return {
    assetType: asset?.assetType ?? "",
    brand: asset?.brand ?? "",
    model: asset?.model ?? "",
    serialNumber: asset?.serialNumber ?? "",
    installDate: asset?.installDate ?? "",
    warrantyExpiration: asset?.warrantyExpiration ?? "",
    condition: asset?.condition ?? "good",
    conditionNotes: asset?.conditionNotes ?? "",
    notes: asset?.notes ?? ""
  };
}

export function AssetForm({ open, onClose, customerId, propertyId, asset }: AssetFormProps) {
  const createAsset = useCreateAsset(customerId, propertyId);
  const updateAsset = useUpdateAsset(customerId, propertyId, asset?.id ?? "pending");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: buildDefaults(asset)
  });

  useEffect(() => {
    if (open) {
      reset(buildDefaults(asset));
    }
  }, [asset, open, reset]);

  async function onSubmit(values: AssetFormValues) {
    try {
      const payload = {
        name: buildAssetName({
          assetType: values.assetType,
          brand: values.brand,
          model: values.model
        }),
        assetType: values.assetType.trim(),
        ...(values.brand?.trim() ? { brand: values.brand.trim() } : {}),
        ...(values.model?.trim() ? { model: values.model.trim() } : {}),
        ...(values.serialNumber?.trim() ? { serialNumber: values.serialNumber.trim() } : {}),
        ...(values.installDate?.trim() ? { installDate: values.installDate.trim() } : {}),
        ...(values.warrantyExpiration?.trim()
          ? { warrantyExpiration: values.warrantyExpiration.trim() }
          : {}),
        condition: values.condition,
        ...(values.conditionNotes?.trim() ? { conditionNotes: values.conditionNotes.trim() } : {}),
        ...(values.notes?.trim() ? { notes: values.notes.trim() } : {})
      };

      if (asset) {
        await updateAsset.mutateAsync(payload);
      } else {
        await createAsset.mutateAsync(payload);
      }

      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.payload.fields) {
        for (const [fieldName, message] of Object.entries(error.payload.fields)) {
          setError(fieldName as keyof AssetFormValues, { message });
        }
      }
    }
  }

  const errorMessage =
    (createAsset.error instanceof ApiError && createAsset.error.message) ||
    (updateAsset.error instanceof ApiError && updateAsset.error.message) ||
    null;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={asset ? "Edit asset" : "Add asset"}
      description="Capture the make, model, install date, and condition so the customer profile surfaces the right service and replacement context."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
        <div className="space-y-5 px-6 py-6">
          <FormError message={errorMessage} />

          <Field label="Asset type" error={errors.assetType?.message}>
            <TextInput {...register("assetType")} placeholder="HVAC unit" />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Make" error={errors.brand?.message}>
              <TextInput {...register("brand")} placeholder="Carrier" />
            </Field>
            <Field label="Model" error={errors.model?.message}>
              <TextInput {...register("model")} placeholder="50TJ-016" />
            </Field>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Serial number" error={errors.serialNumber?.message}>
              <TextInput {...register("serialNumber")} placeholder="SN-48291" />
            </Field>
            <Field label="Condition" error={errors.condition?.message}>
              <SelectInput {...register("condition")}>
                <option value="excellent">Healthy</option>
                <option value="good">Good</option>
                <option value="fair">Aging</option>
                <option value="poor">At Risk</option>
                <option value="failed">Critical</option>
              </SelectInput>
            </Field>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Install date" error={errors.installDate?.message}>
              <TextInput {...register("installDate")} type="date" />
            </Field>
            <Field label="Warranty expiry" error={errors.warrantyExpiration?.message}>
              <TextInput {...register("warrantyExpiration")} type="date" />
            </Field>
          </div>

          <Field label="Condition notes" error={errors.conditionNotes?.message}>
            <TextArea {...register("conditionNotes")} placeholder="Visible coil wear, still operating within spec." />
          </Field>

          <Field label="Notes" error={errors.notes?.message}>
            <TextArea {...register("notes")} placeholder="Anything the team should remember about this piece of equipment." />
          </Field>
        </div>

        <div className="mt-auto flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Saving..." : asset ? "Save changes" : "Add asset"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
