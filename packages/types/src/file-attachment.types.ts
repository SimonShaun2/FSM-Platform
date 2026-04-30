import type { PaginatedResult } from "./customer.types.js";
import type { JobPhotoType } from "./job.types.js";

export type AttachmentEntityType =
  | "job"
  | "customer"
  | "property"
  | "asset"
  | "estimate"
  | "invoice"
  | "work_order";

export type AttachmentFileType = "photo" | "document" | "video";

export interface FileAttachment {
  id: string;
  companyId: string;
  entityType: AttachmentEntityType;
  entityId: string;
  jobId: string | null;
  customerId: string | null;
  uploadedById: string | null;
  fileName: string;
  fileUrl: string;
  thumbnailUrl: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  fileType: AttachmentFileType | null;
  caption: string | null;
  photoType: JobPhotoType | null;
  takenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ListAttachmentsQuery {
  entityType: AttachmentEntityType;
  entityId: string;
  page?: number;
  limit?: number;
}

export type AttachmentListResult = PaginatedResult<FileAttachment>;
