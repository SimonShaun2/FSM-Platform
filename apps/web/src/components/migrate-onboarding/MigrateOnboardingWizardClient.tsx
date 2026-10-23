"use client";

import type { ColumnMapping } from "@fsm/types";
import type { MigrateOnboardingSourceCatalogEntry, MigrateSourceSystemId } from "@fsm/types";
import { useEffect, useMemo, useState } from "react";

import { PageLayout } from "@/src/components/layout/PageLayout";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import { useCompany } from "@/src/hooks/company.hooks";
import { useImportSession } from "@/src/hooks/imports.hooks";
import {
  uploadImportFileForMigrate,
  useCreateMigrateOnboardingSession,
  useLinkMigrateOnboardingFiles,
  useMigrateOnboardingBundle,
  useMigrateOnboardingSources,
  useSetMigrateOnboardingSource
} from "@/src/hooks/migrate-onboarding.hooks";
import { api, ApiError } from "@/src/lib/api";
import { mergeServerMappings } from "@/src/lib/csv-import";
import { getStoredSession } from "@/src/lib/auth";
import { showToast } from "@/src/stores/toast.store";

import { MigrateOnboardingStep1Source } from "./MigrateOnboardingStep1Source";
import {
  MigrateOnboardingStep2UploadMapping,
  type MigrateUploadedFile
} from "./MigrateOnboardingStep2UploadMapping";

function formatError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

export function MigrateOnboardingWizardClient() {
  const companyQuery = useCompany();
  const authSession = useMemo(() => getStoredSession(), []);
  const sourcesQuery = useMigrateOnboardingSources();
  const createSession = useCreateMigrateOnboardingSession();
  const [bundleId, setBundleId] = useState<string | null>(null);
  const bundleQuery = useMigrateOnboardingBundle(bundleId);
  const setSource = useSetMigrateOnboardingSource(bundleId);
  const linkFiles = useLinkMigrateOnboardingFiles(bundleId);

  const [localFiles, setLocalFiles] = useState<MigrateUploadedFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<MigrateSourceSystemId | null>(null);

  const bundle = bundleQuery.data;
  const wizardStep = bundle?.wizardStep ?? 1;

  useEffect(() => {
    if (!bundleId && !createSession.isPending && !createSession.isSuccess) {
      createSession.mutate(true, {
        onSuccess: (created) => {
          setBundleId(created.id);
          if (created.stepState.sourceSystem) {
            setSelectedSourceId(created.stepState.sourceSystem);
          }
        },
        onError: (error) => {
          showToast({ tone: "error", title: "Could not start migration", description: formatError(error) });
        }
      });
    }
  }, [bundleId, createSession]);

  useEffect(() => {
    if (!bundle) {
      return;
    }

    setSelectedSourceId(bundle.stepState.sourceSystem ?? selectedSourceId);
  }, [bundle]);

  const sources: MigrateOnboardingSourceCatalogEntry[] = sourcesQuery.data?.sources ?? [];
  const sourceLabel =
    sources.find((entry) => entry.id === bundle?.stepState.sourceSystem)?.label ?? "Generic CSV";

  async function handleSelectSource(sourceId: MigrateSourceSystemId) {
    setSelectedSourceId(sourceId);

    try {
      const updated = await setSource.mutateAsync(sourceId);
      setBundleId(updated.id);
      showToast({
        tone: "success",
        title: "Source saved",
        description: "Upload your export files in the next step."
      });
    } catch (error: unknown) {
      showToast({ tone: "error", title: "Could not save source", description: formatError(error) });
    }
  }

  async function handleUpload(file: File, entityType: MigrateUploadedFile["ref"]["entityType"]) {
    setIsUploading(true);

    try {
      const { importSession } = await uploadImportFileForMigrate(file, entityType);
      const headers = Object.keys(importSession.columnMappings);
      const mappingOverrides = mergeServerMappings(headers, {}, importSession.columnMappings);

      const ref = {
        importSessionId: importSession.id,
        entityType,
        fileName: importSession.fileName,
        label: importSession.fileName
      };

      setLocalFiles((current) => {
        const next = [
          ...current.filter((item) => item.ref.importSessionId !== importSession.id),
          { ref, session: importSession, mappingOverrides }
        ];
        return next;
      });
      setActiveFileId(importSession.id);
    } catch (error: unknown) {
      showToast({ tone: "error", title: "Upload failed", description: formatError(error) });
    } finally {
      setIsUploading(false);
    }
  }

  function handleUpdateMapping(importSessionId: string, header: string, fieldName: string | null) {
    setLocalFiles((current) =>
      current.map((file) => {
        if (file.ref.importSessionId !== importSessionId) {
          return file;
        }

        const mappingOverrides: ColumnMapping = {
          ...file.mappingOverrides,
          [header]: fieldName
        };

        return { ...file, mappingOverrides };
      })
    );
  }

  const activeSessionQuery = useImportSession(activeFileId, {
    enabled: Boolean(activeFileId) && wizardStep === 2,
    refetchInterval: wizardStep === 2 ? 1500 : false
  });

  useEffect(() => {
    const importSession = activeSessionQuery.data?.importSession;
    if (!importSession || !activeFileId) {
      return;
    }

    setLocalFiles((current) =>
      current.map((file) => {
        if (file.ref.importSessionId !== activeFileId) {
          return file;
        }

        const headers = Object.keys(importSession.columnMappings);
        const merged = mergeServerMappings(headers, file.mappingOverrides, importSession.columnMappings);
        const mappingOverrides =
          Object.keys(file.mappingOverrides).length > 0 ? file.mappingOverrides : merged;

        return {
          ...file,
          session: importSession,
          mappingOverrides
        };
      })
    );
  }, [activeFileId, activeSessionQuery.data?.importSession]);

  async function handleCompleteStep2() {
    if (!bundle || localFiles.length === 0) {
      showToast({
        tone: "error",
        title: "Add at least one file",
        description: "Upload a CSV export before continuing."
      });
      return;
    }

    try {
      for (const file of localFiles) {
        await api.post(`/api/v1/imports/${file.ref.importSessionId}/confirm-mapping`, {
          mappingOverrides: file.mappingOverrides
        });
      }

      const updated = await linkFiles.mutateAsync({
        files: localFiles.map((file) => file.ref)
      });

      setBundleId(updated.id);
      showToast({
        tone: "success",
        title: "Mappings saved",
        description: "Steps 3–5 (preview, dedupe, commit) resume in the same bundle — Pair 5 continues from here."
      });
    } catch (error: unknown) {
      showToast({ tone: "error", title: "Could not finish step 2", description: formatError(error) });
    }
  }

  const isLoading = companyQuery.isLoading || sourcesQuery.isLoading || createSession.isPending || !bundle;

  const companyName = companyQuery.data?.company.name ?? "your company";
  const workEmail = authSession?.user.email ?? "your work email";

  return (
    <PageLayout
      title="Migrate your data"
      subtitle={`${companyName} · signed in as ${workEmail}`}
    >
      {isLoading ? (
        <SkeletonCard className="min-h-[320px]" />
      ) : wizardStep >= 3 ? (
        <section className="rounded-[30px] border border-neutral-200 bg-white px-6 py-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">Steps 3–5</p>
          <h2 className="mt-2 text-xl font-semibold text-neutral-900">Preview & commit (next slice)</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Bundle <span className="font-mono text-xs">{bundle?.id}</span> is on wizard step {wizardStep}. Ben/Leo
            own relational preview, dedupe decisions, and commit UI.
          </p>
        </section>
      ) : wizardStep === 2 ? (
        <MigrateOnboardingStep2UploadMapping
          sourceLabel={sourceLabel}
          files={localFiles}
          activeFileId={activeFileId}
          isUploading={isUploading}
          isLinking={linkFiles.isPending}
          onSelectFile={setActiveFileId}
          onUpload={handleUpload}
          onUpdateMapping={handleUpdateMapping}
          onBack={() => {
            showToast({
              tone: "info",
              title: "Source locked for this bundle",
              description: "Start a new onboarding session to change the source system."
            });
          }}
          onCompleteStep2={() => void handleCompleteStep2()}
        />
      ) : (
        <MigrateOnboardingStep1Source
          sources={sources}
          selectedSourceId={selectedSourceId}
          isSubmitting={setSource.isPending}
          onSelectSource={(sourceId) => void handleSelectSource(sourceId)}
        />
      )}
    </PageLayout>
  );
}
