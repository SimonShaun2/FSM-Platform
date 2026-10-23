"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { publicEnv } from "@fsm/config";
import type {
  LinkMigrateOnboardingFilesBody,
  MigrateOnboardingBundle,
  MigrateOnboardingSourceCatalogEntry,
  MigrateSourceSystemId,
  SetMigrateOnboardingSourceBody,
  WizardImportEntityType
} from "@fsm/types";

import { clearBrowserAuthSession, getAuthToken } from "@/src/lib/auth";
import { api, ApiError, type ApiErrorPayload } from "@/src/lib/api";
import type { ImportSessionResponse } from "@/src/hooks/imports.hooks";

const migrateKeys = {
  all: ["migrate-onboarding"] as const,
  sources: ["migrate-onboarding", "sources"] as const,
  active: ["migrate-onboarding", "active"] as const,
  bundle: (id: string) => ["migrate-onboarding", "bundle", id] as const
};

function parseUploadError(responseText: string): ApiErrorPayload {
  try {
    return JSON.parse(responseText) as ApiErrorPayload;
  } catch {
    return {
      error: "NOT_IMPLEMENTED",
      message: responseText || "Import upload failed"
    };
  }
}

export async function uploadImportFileForMigrate(
  file: File,
  entityType: WizardImportEntityType
): Promise<ImportSessionResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("entityType", entityType);

  const token = getAuthToken();
  const uploadResponse = await fetch(`${publicEnv.NEXT_PUBLIC_API_URL}/api/v1/imports`, {
    method: "POST",
    body: formData,
    credentials: "include",
    ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {})
  });

  if (uploadResponse.status === 401) {
    clearBrowserAuthSession();
    if (typeof window !== "undefined") {
      window.location.assign("/login");
    }
  }

  if (!uploadResponse.ok) {
    throw new ApiError(uploadResponse.status, parseUploadError(await uploadResponse.text()));
  }

  return (await uploadResponse.json()) as ImportSessionResponse;
}

export function useMigrateOnboardingSources() {
  return useQuery({
    queryKey: migrateKeys.sources,
    queryFn: () =>
      api.get<{ sources: MigrateOnboardingSourceCatalogEntry[] }>("/api/v1/migrate/onboarding/sources")
  });
}

export function useActiveMigrateOnboardingBundle() {
  return useQuery({
    queryKey: migrateKeys.active,
    queryFn: () => api.get<MigrateOnboardingBundle | null>("/api/v1/migrate/onboarding/sessions/active")
  });
}

export function useMigrateOnboardingBundle(bundleId: string | null, enabled = true) {
  return useQuery({
    queryKey: bundleId ? migrateKeys.bundle(bundleId) : migrateKeys.active,
    queryFn: () => api.get<MigrateOnboardingBundle>(`/api/v1/migrate/onboarding/sessions/${bundleId}`),
    enabled: enabled && Boolean(bundleId)
  });
}

export function useCreateMigrateOnboardingSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resumeActive: boolean) =>
      api.post<MigrateOnboardingBundle>("/api/v1/migrate/onboarding/sessions", { resumeActive }),
    onSuccess: async (bundle) => {
      queryClient.setQueryData(migrateKeys.bundle(bundle.id), bundle);
      queryClient.setQueryData(migrateKeys.active, bundle);
      await queryClient.invalidateQueries({ queryKey: migrateKeys.all });
    }
  });
}

export function useSetMigrateOnboardingSource(bundleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sourceSystem: MigrateSourceSystemId) => {
      if (!bundleId) {
        throw new Error("Bundle id is required");
      }

      const body: SetMigrateOnboardingSourceBody = { sourceSystem };
      return api.patch<MigrateOnboardingBundle>(
        `/api/v1/migrate/onboarding/sessions/${bundleId}/source`,
        body
      );
    },
    onSuccess: async (bundle) => {
      queryClient.setQueryData(migrateKeys.bundle(bundle.id), bundle);
      queryClient.setQueryData(migrateKeys.active, bundle);
    }
  });
}

export function useLinkMigrateOnboardingFiles(bundleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: LinkMigrateOnboardingFilesBody) => {
      if (!bundleId) {
        throw new Error("Bundle id is required");
      }

      return api.patch<MigrateOnboardingBundle>(
        `/api/v1/migrate/onboarding/sessions/${bundleId}/files`,
        body
      );
    },
    onSuccess: async (bundle) => {
      queryClient.setQueryData(migrateKeys.bundle(bundle.id), bundle);
      queryClient.setQueryData(migrateKeys.active, bundle);
    }
  });
}
