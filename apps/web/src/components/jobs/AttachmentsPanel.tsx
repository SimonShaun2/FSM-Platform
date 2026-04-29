"use client";

import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Camera, FileText, Paperclip, Trash2, UploadCloud } from "lucide-react";
import type { FileAttachment } from "@fsm/types";

import { EmptyState } from "@/src/components/ui/EmptyState";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import { StatBadge } from "@/src/components/ui/StatBadge";
import { useDeleteAttachment, useJobAttachments, useUploadAttachment } from "@/src/hooks/jobs.hooks";
import { cn } from "@/src/lib/utils";

import { formatDateTime } from "./jobs.utils";

type AttachmentFilter = "all" | "photos" | "documents";

interface AttachmentsPanelProps {
  jobId: string;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) {
    return "—";
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getPhotoBadgeTone(photoType: FileAttachment["photoType"]): "blue" | "green" | "orange" {
  switch (photoType) {
    case "before":
      return "orange";
    case "after":
      return "green";
    default:
      return "blue";
  }
}

export function AttachmentsPanel({ jobId }: AttachmentsPanelProps) {
  const attachmentsQuery = useJobAttachments(jobId);
  const uploadAttachment = useUploadAttachment(jobId);
  const deleteAttachment = useDeleteAttachment(jobId);
  const [filter, setFilter] = useState<AttachmentFilter>("all");
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);

  const attachments = attachmentsQuery.data?.data ?? [];
  const filteredAttachments = useMemo(() => {
    switch (filter) {
      case "photos":
        return attachments.filter((attachment) => attachment.fileType === "photo");
      case "documents":
        return attachments.filter((attachment) => attachment.fileType !== "photo");
      default:
        return attachments;
    }
  }, [attachments, filter]);
  const photos = filteredAttachments.filter((attachment) => attachment.fileType === "photo");
  const documents = filteredAttachments.filter((attachment) => attachment.fileType !== "photo");

  async function uploadFiles(files: FileList | File[]) {
    if (files.length === 0) {
      return;
    }

    setErrorMessage(null);

    for (const file of Array.from(files)) {
      setUploadingFileName(file.name);
      setUploadProgress(0);

      try {
        await uploadAttachment.mutateAsync({
          file,
          onProgress: setUploadProgress,
          ...(file.type.startsWith("image/") ? { photoType: "general" as const } : {})
        });
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Upload failed.");
      }
    }

    setUploadingFileName(null);
    setUploadProgress(null);
  }

  async function handleDelete(attachmentId: string) {
    setErrorMessage(null);

    try {
      await deleteAttachment.mutateAsync(attachmentId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Attachment could not be deleted.");
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;

    if (!files) {
      return;
    }

    void uploadFiles(files);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);

    if (event.dataTransfer.files.length > 0) {
      void uploadFiles(event.dataTransfer.files);
    }
  }

  return (
    <section className="surface-card px-6 py-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">📎 Attachments ({attachments.length})</h2>
          <p className="mt-1 text-sm text-neutral-500">Upload photos and documents directly against the job record.</p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-sm font-semibold text-brand-accent"
        >
          + Upload
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {[
          { key: "all", label: `All (${attachments.length})` },
          {
            key: "photos",
            label: `Photos (${attachments.filter((attachment) => attachment.fileType === "photo").length})`
          },
          {
            key: "documents",
            label: `Documents (${attachments.filter((attachment) => attachment.fileType !== "photo").length})`
          }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key as AttachmentFilter)}
            className={
              filter === tab.key
                ? "rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-white"
                : "rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-500 transition hover:text-neutral-900"
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {attachmentsQuery.isLoading ? (
        <div className="mt-5 space-y-3">
          <SkeletonCard className="h-[180px]" />
          <SkeletonCard className="h-[140px]" />
        </div>
      ) : (
        <>
          {photos.length > 0 ? (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {photos.map((attachment) => (
                <div key={attachment.id} className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-sm">
                  <div className="relative aspect-[4/3] bg-neutral-100">
                    {attachment.fileUrl ? (
                      <img
                        src={attachment.thumbnailUrl ?? attachment.fileUrl}
                        alt={attachment.caption ?? attachment.fileName}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                    <div className="absolute left-3 top-3">
                      <StatBadge
                        label={attachment.photoType ?? "general"}
                        tone={getPhotoBadgeTone(attachment.photoType)}
                      />
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900">{attachment.caption ?? attachment.fileName}</p>
                      <p className="mt-1 text-xs text-neutral-400">{formatDateTime(attachment.createdAt)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void handleDelete(attachment.id);
                      }}
                      className="rounded-full p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                      aria-label={`Delete ${attachment.fileName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {documents.length > 0 ? (
            <div className="mt-5 space-y-3">
              {documents.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex flex-col gap-3 rounded-[24px] border border-neutral-200 bg-white px-4 py-4 shadow-sm md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-error-light text-error">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900">{attachment.fileName}</p>
                      <p className="mt-1 text-sm text-neutral-500">
                        {formatFileSize(attachment.fileSizeBytes)} • {formatDateTime(attachment.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-brand-accent"
                    >
                      Download
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        void handleDelete(attachment.id);
                      }}
                      className="rounded-full p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                      aria-label={`Delete ${attachment.fileName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {filteredAttachments.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                icon={Paperclip}
                title="No attachments yet"
                subtitle="Drag photos or documents here, or upload from camera on mobile."
                compact
              />
            </div>
          ) : null}
        </>
      )}

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          "mt-6 rounded-[28px] border border-dashed px-6 py-8 text-center transition",
          dragActive ? "border-brand-accent bg-brand-accent-light/40" : "border-neutral-200 bg-neutral-50"
        )}
      >
        <div className="flex flex-col items-center gap-3 text-neutral-500">
          <UploadCloud className="h-6 w-6 text-brand-accent" />
          <div>
            <p className="text-sm font-semibold text-neutral-700">Drag photos or documents here</p>
            <p className="mt-1 text-sm">or choose files from the device</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-accent shadow-sm"
            >
              Choose Files
            </button>
            <button
              type="button"
              onClick={() => mobileCameraInputRef.current?.click()}
              className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 md:hidden"
            >
              <span className="inline-flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Take Photo
              </span>
            </button>
          </div>
        </div>
      </div>

      {uploadingFileName && uploadProgress !== null ? (
        <div className="mt-4 rounded-[22px] border border-neutral-200 bg-neutral-50 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-neutral-700">Uploading {uploadingFileName}</p>
            <p className="text-sm font-semibold text-brand-accent">{uploadProgress}%</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200">
            <div className="h-full rounded-full bg-brand-accent transition-[width] duration-150" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <p className="mt-4 rounded-3xl border border-error/15 bg-error-light px-4 py-3 text-sm text-error">{errorMessage}</p>
      ) : null}

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleInputChange} />
      <input
        ref={mobileCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />
    </section>
  );
}
