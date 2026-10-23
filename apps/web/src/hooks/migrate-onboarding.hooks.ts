"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ApplyMigrateDedupeDecisionsBody,
  LinkMigrateOnboardingFilesBody,
  MigrateSourceSystemId
} from "@fsm/types";

import { migrateOnboardingRealClient } from "@/src/lib/migrate-onboarding-client";
import {
  isPriyaOnboardingMockEnabled,
  migrateOnboardingPriyaMockClient
} from "@/src/lib/migrate-onboarding-priya-mock";
import { useMigrateOnboardingWizardStore } from "@/src/stores/migrate-onboarding-wizard.store";

const priyaClient = migrateOnboardingPriyaMockClient;

export function useMigrateOnboardingBundle(bundleId: string | null) {
  const setBundle = useMigrateOnboardingWizardStore((state) => state.setBundle);

  return useQuery({
    queryKey: ["migrate-onboarding", "bundle", bundleId],
    enabled: Boolean(bundleId),
    refetchInterval: (query) => (query.state.data?.status === "committing" ? 2000 : false),
    queryFn: async () => {
      if (!bundleId) {
        throw new Error("Missing bundle id");
      }
      const bundle = await migrateOnboardingRealClient.getBundle(bundleId);
      setBundle(bundle.id, bundle.wizardStep);
      return bundle;
    }
  });
}

export function useResumeMigrateOnboardingSession() {
  const { bundleId: storedBundleId, setBundle } = useMigrateOnboardingWizardStore();

  return useQuery({
    queryKey: ["migrate-onboarding", "resume", storedBundleId],
    queryFn: async () => {
      if (storedBundleId) {
        try {
          const bundle = await migrateOnboardingRealClient.getBundle(storedBundleId);
          setBundle(bundle.id, bundle.wizardStep);
          return bundle;
        } catch {
          // fall through to active session
        }
      }

      try {
        const active = await migrateOnboardingRealClient.getActiveSession();
        setBundle(active.id, active.wizardStep);
        return active;
      } catch (error) {
        if (error instanceof Error && error.message === "NO_ACTIVE_SESSION") {
          // expected when no in-progress bundle
        } else if (!(error instanceof Error)) {
          throw error;
        }
        if (isPriyaOnboardingMockEnabled()) {
          const mockActive = await priyaClient.getActiveSession();
          if (mockActive) {
            setBundle(mockActive.id, mockActive.wizardStep);
            return mockActive;
          }
        }
        return null;
      }
    }
  });
}

export function useMigrateRelationalPreview(bundleId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["migrate-onboarding", "relational-preview", bundleId],
    enabled: Boolean(bundleId) && enabled,
    queryFn: () => migrateOnboardingRealClient.getRelationalPreview(bundleId as string)
  });
}

export function useMigrateDedupePreview(bundleId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["migrate-onboarding", "dedupe-preview", bundleId],
    enabled: Boolean(bundleId) && enabled,
    queryFn: () => migrateOnboardingRealClient.getDedupePreview(bundleId as string)
  });
}

export function useConfirmMigrateMappings(bundleId: string | null) {
  const queryClient = useQueryClient();
  const setBundle = useMigrateOnboardingWizardStore((state) => state.setBundle);

  return useMutation({
    mutationFn: () => {
      if (!bundleId) {
        throw new Error("Missing onboarding bundle");
      }
      return migrateOnboardingRealClient.confirmMappings(bundleId);
    },
    onSuccess: (bundle) => {
      setBundle(bundle.id, bundle.wizardStep);
      void queryClient.invalidateQueries({ queryKey: ["migrate-onboarding"] });
    }
  });
}

export function useAcknowledgeMigratePreview(bundleId: string | null) {
  const queryClient = useQueryClient();
  const setBundle = useMigrateOnboardingWizardStore((state) => state.setBundle);

  return useMutation({
    mutationFn: () => {
      if (!bundleId) {
        throw new Error("Missing onboarding bundle");
      }
      return migrateOnboardingRealClient.acknowledgePreview(bundleId);
    },
    onSuccess: (bundle) => {
      setBundle(bundle.id, bundle.wizardStep);
      void queryClient.invalidateQueries({ queryKey: ["migrate-onboarding"] });
    }
  });
}

export function useApplyMigrateDedupeDecisions(bundleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ApplyMigrateDedupeDecisionsBody) => {
      if (!bundleId) {
        throw new Error("Missing onboarding bundle");
      }
      return migrateOnboardingRealClient.applyDedupeDecisions(bundleId, body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["migrate-onboarding", "dedupe-preview", bundleId] });
    }
  });
}

export function useCommitMigrateBundle(bundleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!bundleId) {
        throw new Error("Missing onboarding bundle");
      }
      return migrateOnboardingRealClient.commit(bundleId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["migrate-onboarding", "bundle", bundleId] });
    }
  });
}

export function usePriyaOnboardingSteps(bundleId: string | null) {
  const queryClient = useQueryClient();
  const setBundle = useMigrateOnboardingWizardStore((state) => state.setBundle);

  const createSession = useMutation({
    mutationFn: () => priyaClient.createSession(),
    onSuccess: (bundle) => setBundle(bundle.id, bundle.wizardStep)
  });

  const setSource = useMutation({
    mutationFn: (sourceSystem: MigrateSourceSystemId) => {
      if (!bundleId) {
        throw new Error("Create a session first");
      }
      return priyaClient.setSource(bundleId, { sourceSystem });
    },
    onSuccess: (bundle) => {
      setBundle(bundle.id, bundle.wizardStep);
      void queryClient.invalidateQueries({ queryKey: ["migrate-onboarding"] });
    }
  });

  const linkFiles = useMutation({
    mutationFn: (files: LinkMigrateOnboardingFilesBody["files"]) => {
      if (!bundleId) {
        throw new Error("Create a session first");
      }
      return priyaClient.linkFiles(bundleId, { files });
    },
    onSuccess: (bundle) => {
      setBundle(bundle.id, bundle.wizardStep);
      void queryClient.invalidateQueries({ queryKey: ["migrate-onboarding"] });
    }
  });

  return { createSession, setSource, linkFiles };
}
