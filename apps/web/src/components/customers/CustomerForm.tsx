"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { CustomerDetailRecord } from "@/src/hooks/customers.hooks";
import { useCreateCustomer, useUpdateCustomer } from "@/src/hooks/customers.hooks";
import { ApiError } from "@/src/lib/api";

import { Field, FormError, CheckboxField, TextArea, TextInput } from "./form-controls";
import { stringToTags, tagsToString } from "./customers.utils";
import { Sheet } from "../ui/Sheet";

const phonePattern = /^[0-9+()\-\s]{7,20}$/;

const customerFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  displayName: z.string().trim().max(255).optional(),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(phonePattern, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  altPhone: z
    .string()
    .trim()
    .regex(phonePattern, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  tags: z.string().optional(),
  leadSource: z.string().trim().optional(),
  internalNotes: z.string().trim().optional(),
  prefersSms: z.boolean(),
  prefersEmail: z.boolean(),
  doNotContact: z.boolean()
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  open: boolean;
  onClose: () => void;
  customer?: CustomerDetailRecord | null;
  onSaved?: (customerId: string) => void;
}

function buildDefaults(customer?: CustomerDetailRecord | null): CustomerFormValues {
  return {
    firstName: customer?.firstName ?? "",
    lastName: customer?.lastName ?? "",
    displayName: customer?.displayName ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
    altPhone: customer?.altPhone ?? "",
    tags: customer ? tagsToString(customer.tags) : "",
    leadSource: customer?.leadSource ?? "",
    internalNotes: customer?.internalNotes ?? "",
    prefersSms: customer?.prefersSms ?? true,
    prefersEmail: customer?.prefersEmail ?? true,
    doNotContact: customer?.doNotContact ?? false
  };
}

export function CustomerForm({ open, onClose, customer, onSaved }: CustomerFormProps) {
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer(customer?.id ?? "pending");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    watch,
    setValue
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: buildDefaults(customer)
  });

  useEffect(() => {
    if (open) {
      reset(buildDefaults(customer));
    }
  }, [customer, open, reset]);

  async function onSubmit(values: CustomerFormValues) {
    try {
      const payload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        ...(values.displayName?.trim() ? { displayName: values.displayName.trim() } : {}),
        ...(values.email?.trim() ? { email: values.email.trim() } : {}),
        ...(values.phone?.trim() ? { phone: values.phone.trim() } : {}),
        ...(values.altPhone?.trim() ? { altPhone: values.altPhone.trim() } : {}),
        ...(values.leadSource?.trim() ? { leadSource: values.leadSource.trim() } : {}),
        ...(values.internalNotes?.trim() ? { internalNotes: values.internalNotes.trim() } : {}),
        ...(values.tags?.trim() ? { tags: stringToTags(values.tags) } : {}),
        prefersSms: values.prefersSms,
        prefersEmail: values.prefersEmail,
        doNotContact: values.doNotContact
      };

      const response = customer
        ? await updateCustomer.mutateAsync(payload)
        : await createCustomer.mutateAsync(payload);

      onSaved?.(response.customer.id);
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.payload.fields) {
        for (const [fieldName, message] of Object.entries(error.payload.fields)) {
          if (fieldName in values) {
            setError(fieldName as keyof CustomerFormValues, {
              message
            });
          }
        }
      }
    }
  }

  const mutationError =
    (createCustomer.error instanceof ApiError && createCustomer.error.message) ||
    (updateCustomer.error instanceof ApiError && updateCustomer.error.message) ||
    null;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={customer ? "Edit customer" : "New customer"}
      description="Capture the core contact details, preferences, and notes that keep the relationship clean across dispatch, sales, and service."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
        <div className="space-y-5 px-6 py-6">
          <FormError message={mutationError} />
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="First name" error={errors.firstName?.message}>
              <TextInput {...register("firstName")} placeholder="Alex" />
            </Field>
            <Field label="Last name" error={errors.lastName?.message}>
              <TextInput {...register("lastName")} placeholder="Mercer" />
            </Field>
          </div>

          <Field label="Business name" error={errors.displayName?.message}>
            <TextInput {...register("displayName")} placeholder="Acme Property Mgmt" />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Email" error={errors.email?.message}>
              <TextInput {...register("email")} type="email" placeholder="billing@acme.co" />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <TextInput {...register("phone")} placeholder="(415) 555-1117" />
            </Field>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Alt phone" error={errors.altPhone?.message}>
              <TextInput {...register("altPhone")} placeholder="Optional" />
            </Field>
            <Field label="Lead source" error={errors.leadSource?.message}>
              <TextInput {...register("leadSource")} placeholder="Referral" />
            </Field>
          </div>

          <Field label="Tags" hint="Comma-separated chips" error={errors.tags?.message}>
            <TextInput {...register("tags")} placeholder="Commercial, HVAC, Priority" />
          </Field>

          <Field label="Internal notes" error={errors.internalNotes?.message}>
            <TextArea {...register("internalNotes")} placeholder="Anything the office should know before the next call-out." />
          </Field>

          <div className="grid gap-3">
            <CheckboxField
              label="Prefers SMS"
              checked={watch("prefersSms")}
              onChange={(checked) => setValue("prefersSms", checked)}
            />
            <CheckboxField
              label="Prefers email"
              checked={watch("prefersEmail")}
              onChange={(checked) => setValue("prefersEmail", checked)}
            />
            <CheckboxField
              label="Do not contact"
              checked={watch("doNotContact")}
              onChange={(checked) => setValue("doNotContact", checked)}
            />
          </div>
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
            {isSubmitting ? "Saving..." : customer ? "Save changes" : "Create customer"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
