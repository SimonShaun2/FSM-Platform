"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useCreateProperty, type PropertyRecord } from "@/src/hooks/customers.hooks";
import { ApiError } from "@/src/lib/api";

import { Field, FormError, SelectInput, TextArea, TextInput } from "./form-controls";
import { Sheet } from "../ui/Sheet";

const propertyFormSchema = z.object({
  addressLine1: z.string().trim().min(1, "Address is required"),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  zip: z.string().trim().min(1, "ZIP is required"),
  type: z.enum(["residential", "commercial", "industrial", "multi_family"]),
  accessNotes: z.string().trim().optional(),
  yearBuilt: z
    .string()
    .trim()
    .regex(/^\d{0,4}$/, "Enter a 4-digit year")
    .optional(),
  notes: z.string().trim().optional()
});

type PropertyFormValues = z.infer<typeof propertyFormSchema>;

interface PropertyFormProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  property?: PropertyRecord | null;
}

function buildDefaults(property?: PropertyRecord | null): PropertyFormValues {
  return {
    addressLine1: property?.addressLine1 ?? "",
    addressLine2: property?.addressLine2 ?? "",
    city: property?.city ?? "",
    state: property?.state ?? "",
    zip: property?.zip ?? "",
    type: property?.type ?? "commercial",
    accessNotes: property?.accessNotes ?? "",
    yearBuilt: property?.yearBuilt ? String(property.yearBuilt) : "",
    notes: property?.notes ?? ""
  };
}

export function PropertyForm({ open, onClose, customerId, property }: PropertyFormProps) {
  const createProperty = useCreateProperty(customerId);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: buildDefaults(property)
  });

  useEffect(() => {
    if (open) {
      reset(buildDefaults(property));
    }
  }, [open, property, reset]);

  async function onSubmit(values: PropertyFormValues) {
    try {
      await createProperty.mutateAsync({
        addressLine1: values.addressLine1.trim(),
        ...(values.addressLine2?.trim() ? { addressLine2: values.addressLine2.trim() } : {}),
        city: values.city.trim(),
        state: values.state.trim(),
        zip: values.zip.trim(),
        type: values.type,
        ...(values.accessNotes?.trim() ? { accessNotes: values.accessNotes.trim() } : {}),
        ...(values.yearBuilt?.trim() ? { yearBuilt: Number.parseInt(values.yearBuilt, 10) } : {}),
        ...(values.notes?.trim() ? { notes: values.notes.trim() } : {})
      });
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.payload.fields) {
        for (const [fieldName, message] of Object.entries(error.payload.fields)) {
          setError(fieldName as keyof PropertyFormValues, { message });
        }
      }
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add property"
      description="Create the location record that jobs, assets, access notes, and service history will attach to."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
        <div className="space-y-5 px-6 py-6">
          <FormError message={createProperty.error instanceof ApiError ? createProperty.error.message : null} />

          <Field label="Address line 1" error={errors.addressLine1?.message}>
            <TextInput {...register("addressLine1")} placeholder="456 Market St" />
          </Field>

          <Field label="Address line 2" error={errors.addressLine2?.message}>
            <TextInput {...register("addressLine2")} placeholder="Suite 1200" />
          </Field>

          <div className="grid gap-5 md:grid-cols-[1.2fr_0.7fr_0.8fr]">
            <Field label="City" error={errors.city?.message}>
              <TextInput {...register("city")} placeholder="Chicago" />
            </Field>
            <Field label="State" error={errors.state?.message}>
              <TextInput {...register("state")} placeholder="IL" />
            </Field>
            <Field label="ZIP" error={errors.zip?.message}>
              <TextInput {...register("zip")} placeholder="60607" />
            </Field>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Property type" error={errors.type?.message}>
              <SelectInput {...register("type")}>
                <option value="commercial">Commercial</option>
                <option value="residential">Residential</option>
                <option value="industrial">Industrial</option>
                <option value="multi_family">Multi-family</option>
              </SelectInput>
            </Field>
            <Field label="Year built" error={errors.yearBuilt?.message}>
              <TextInput {...register("yearBuilt")} placeholder="1998" />
            </Field>
          </div>

          <Field label="Access notes" error={errors.accessNotes?.message}>
            <TextArea {...register("accessNotes")} placeholder="Dock access after 8 AM. Mechanical room code is on file." />
          </Field>

          <Field label="Internal notes" error={errors.notes?.message}>
            <TextArea {...register("notes")} placeholder="Anything the team should know about this site." />
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
            {isSubmitting ? "Saving..." : "Add property"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
