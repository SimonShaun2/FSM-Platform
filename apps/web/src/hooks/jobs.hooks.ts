"use client";

import { publicEnv } from "@fsm/config";
import {
  type AddJobProductInput,
  type CreateReviewRequestInput,
  type CreateTaskInput,
  type FileAttachment,
  type JobDetail,
  type JobProduct,
  type JobStatus,
  type JobTask,
  type Product,
  type TimeEntry,
  type UpdateJobInput,
  type UpdateJobProductInput,
  type UpdateTaskInput
} from "@fsm/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getAuthToken } from "@/src/lib/auth";
import { api, ApiError, type ApiErrorPayload } from "@/src/lib/api";

interface ActivityEventRecord {
  id: string;
  companyId: string;
  eventType: string;
  actorId: string | null;
  actorType: string | null;
  actorName: string | null;
  entityType: string;
  entityId: string;
  customerId: string | null;
  jobId: string | null;
  estimateId: string | null;
  invoiceId: string | null;
  payload: unknown;
  summary: string;
  occurredAt: string;
}

interface PaginatedResponse<TItem> {
  data: TItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface JobResponse {
  job: JobDetail;
}

interface JobTaskResponse {
  task: JobTask;
}

interface JobTasksResponse {
  tasks: JobTask[];
}

interface JobProductResponse {
  product: JobProduct;
}

interface JobProductsResponse {
  products: JobProduct[];
}

interface TimeEntryResponse {
  timeEntry: TimeEntry;
}

interface TimeEntriesResponse {
  timeEntries: TimeEntry[];
}

export interface OnTheWayNotificationRecord {
  id: string;
  companyId: string;
  jobId: string;
  technicianId: string;
  customerId: string;
  sentAt: string | null;
  channel: string | null;
  message: string | null;
  estimatedArrivalMinutes: number | null;
  technicianLat: string | null;
  technicianLng: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface OnTheWayResponse {
  notification: OnTheWayNotificationRecord | null;
}

export interface ReviewRequestRecord {
  id: string;
  companyId: string;
  jobId: string | null;
  customerId: string;
  technicianId: string | null;
  referenceId: string;
  status: string;
  channel: "sms" | "email";
  reviewUrl: string | null;
  sentAt: string | null;
  clickedAt: string | null;
  completedAt: string | null;
  rating: number | null;
  reviewText: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface ReviewRequestResponse {
  reviewRequest: ReviewRequestRecord;
}

interface AttachmentResponse {
  attachment: FileAttachment;
}

export interface CompanySettingsRecord {
  taxRate?: number | string;
  defaultTaxRate?: number | string;
  pricing?: {
    taxRate?: number | string;
    defaultTaxRate?: number | string;
  };
  billing?: {
    taxRate?: number | string;
  };
  [key: string]: unknown;
}

export interface CompanyRecord {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  timezone: string;
  logoUrl: string | null;
  settings: CompanySettingsRecord;
  createdAt: string;
}

interface CompanyResponse {
  company: CompanyRecord;
}

interface ProductSearchResponse {
  products: Product[];
}

interface ActivityResponse extends PaginatedResponse<ActivityEventRecord> {}
interface AttachmentListResponse extends PaginatedResponse<FileAttachment> {}

export interface UploadAttachmentInput {
  file: File;
  caption?: string;
  photoType?: "before" | "after" | "general";
  takenAt?: string;
  onProgress?: (progress: number) => void;
}

export interface SendOnTheWayInput {
  technicianId?: string;
  estimatedArrivalMinutes?: number;
  message?: string;
  technicianLat?: number;
  technicianLng?: number;
}

const API_BASE = publicEnv.NEXT_PUBLIC_API_URL;

const jobKeys = {
  all: ["jobs"] as const,
  detail: (jobId: string) => ["jobs", "detail", jobId] as const,
  tasks: (jobId: string) => ["jobs", "tasks", jobId] as const,
  products: (jobId: string) => ["jobs", "products", jobId] as const,
  time: (jobId: string) => ["jobs", "time", jobId] as const,
  otw: (jobId: string) => ["jobs", "otw", jobId] as const,
  attachments: (jobId: string) => ["jobs", "attachments", jobId] as const,
  activity: (jobId: string) => ["jobs", "activity", jobId] as const,
  productSearch: (search: string) => ["jobs", "product-search", search] as const
};

function toErrorPayload(text: string): ApiErrorPayload {
  try {
    return JSON.parse(text) as ApiErrorPayload;
  } catch {
    return {
      error: "NOT_IMPLEMENTED",
      message: text || "Request failed"
    };
  }
}

async function invalidateJobQueries(queryClient: ReturnType<typeof useQueryClient>, jobId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) }),
    queryClient.invalidateQueries({ queryKey: jobKeys.tasks(jobId) }),
    queryClient.invalidateQueries({ queryKey: jobKeys.products(jobId) }),
    queryClient.invalidateQueries({ queryKey: jobKeys.time(jobId) }),
    queryClient.invalidateQueries({ queryKey: jobKeys.otw(jobId) }),
    queryClient.invalidateQueries({ queryKey: jobKeys.attachments(jobId) }),
    queryClient.invalidateQueries({ queryKey: jobKeys.activity(jobId) }),
    queryClient.invalidateQueries({ queryKey: ["dispatch"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] })
  ]);
}

function uploadAttachmentRequest(jobId: string, input: UploadAttachmentInput): Promise<FileAttachment> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    const token = getAuthToken();
    const request = new XMLHttpRequest();

    formData.append("file", input.file);
    formData.append("entityType", "job");
    formData.append("entityId", jobId);

    if (input.caption) {
      formData.append("caption", input.caption);
    }

    if (input.photoType) {
      formData.append("photoType", input.photoType);
    }

    if (input.takenAt) {
      formData.append("takenAt", input.takenAt);
    }

    request.open("POST", `${API_BASE}/api/v1/attachments`);
    request.withCredentials = true;

    if (token) {
      request.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      input.onProgress?.(Math.round((event.loaded / event.total) * 100));
    };

    request.onerror = () => {
      reject(new Error("Upload failed"));
    };

    request.onload = () => {
      const payload = toErrorPayload(request.responseText);

      if (request.status < 200 || request.status >= 300) {
        reject(new ApiError(request.status, payload));
        return;
      }

      try {
        const parsed = JSON.parse(request.responseText) as AttachmentResponse;
        resolve(parsed.attachment);
      } catch {
        reject(new Error("Attachment upload response was invalid"));
      }
    };

    request.send(formData);
  });
}

export function useJob(jobId: string | null) {
  return useQuery({
    queryKey: jobId ? jobKeys.detail(jobId) : jobKeys.detail("pending"),
    queryFn: () => api.get<JobResponse>(`/api/v1/jobs/${jobId}`),
    enabled: Boolean(jobId)
  });
}

export function useUpdateJob(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateJobInput) => api.patch<JobResponse>(`/api/v1/jobs/${jobId}`, input),
    onSuccess: async () => {
      await invalidateJobQueries(queryClient, jobId);
    }
  });
}

export function useTransitionJob(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { status: JobStatus; reason?: string }) => {
      if (input.status === "completed") {
        return api.post<JobResponse>(`/api/v1/jobs/${jobId}/complete`, {});
      }

      return api.post<JobResponse>(`/api/v1/jobs/${jobId}/status`, input);
    },
    onSuccess: async () => {
      await invalidateJobQueries(queryClient, jobId);
    }
  });
}

export function useJobTasks(jobId: string | null) {
  return useQuery({
    queryKey: jobId ? jobKeys.tasks(jobId) : jobKeys.tasks("pending"),
    queryFn: () => api.get<JobTasksResponse>(`/api/v1/jobs/${jobId}/tasks`),
    enabled: Boolean(jobId)
  });
}

export function useCreateTask(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => api.post<JobTaskResponse>(`/api/v1/jobs/${jobId}/tasks`, input),
    onSuccess: async () => {
      await invalidateJobQueries(queryClient, jobId);
    }
  });
}

export function useUpdateTask(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) =>
      api.patch<JobTaskResponse>(`/api/v1/jobs/${jobId}/tasks/${taskId}`, input),
    onSuccess: async () => {
      await invalidateJobQueries(queryClient, jobId);
    }
  });
}

export function useCompleteTask(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => api.post<JobTaskResponse>(`/api/v1/jobs/${jobId}/tasks/${taskId}/complete`, {}),
    onSuccess: async () => {
      await invalidateJobQueries(queryClient, jobId);
    }
  });
}

export function useReorderTasks(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      api.post<{ success: boolean }>(`/api/v1/jobs/${jobId}/tasks/reorder`, {
        orderedIds
      }),
    onSuccess: async () => {
      await invalidateJobQueries(queryClient, jobId);
    }
  });
}

export function useJobProducts(jobId: string | null) {
  return useQuery({
    queryKey: jobId ? jobKeys.products(jobId) : jobKeys.products("pending"),
    queryFn: () => api.get<JobProductsResponse>(`/api/v1/jobs/${jobId}/products`),
    enabled: Boolean(jobId)
  });
}

export function useAddJobProduct(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddJobProductInput) =>
      api.post<JobProductResponse>(`/api/v1/jobs/${jobId}/products`, input),
    onSuccess: async () => {
      await invalidateJobQueries(queryClient, jobId);
    }
  });
}

export function useUpdateJobProduct(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, input }: { productId: string; input: UpdateJobProductInput }) =>
      api.patch<JobProductResponse>(`/api/v1/jobs/${jobId}/products/${productId}`, input),
    onSuccess: async () => {
      await invalidateJobQueries(queryClient, jobId);
    }
  });
}

export function useRemoveJobProduct(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => api.delete<{ success: boolean }>(`/api/v1/jobs/${jobId}/products/${productId}`),
    onSuccess: async () => {
      await invalidateJobQueries(queryClient, jobId);
    }
  });
}

export function useApproveUpsell(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      api.post<JobProductResponse>(`/api/v1/jobs/${jobId}/products/${productId}/approve-upsell`, {}),
    onSuccess: async () => {
      await invalidateJobQueries(queryClient, jobId);
    }
  });
}

export function useProductSearch(search: string) {
  return useQuery({
    queryKey: jobKeys.productSearch(search),
    queryFn: () => api.get<ProductSearchResponse>(`/api/v1/products/search?q=${encodeURIComponent(search)}`),
    enabled: search.trim().length >= 2,
    staleTime: 30 * 1000
  });
}

export function useJobTimeEntries(jobId: string | null) {
  return useQuery({
    queryKey: jobId ? jobKeys.time(jobId) : jobKeys.time("pending"),
    queryFn: () => api.get<TimeEntriesResponse>(`/api/v1/jobs/${jobId}/time`),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const entries = (query.state.data as TimeEntriesResponse | undefined)?.timeEntries ?? [];
      return entries.some((entry) => !entry.endedAt) ? 15 * 1000 : false;
    }
  });
}

export function useStartTimer(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { technicianId?: string; entryType?: "travel" | "on_site" | "break"; notes?: string }) =>
      api.post<TimeEntryResponse>(`/api/v1/jobs/${jobId}/time/start`, input),
    onSuccess: async () => {
      await invalidateJobQueries(queryClient, jobId);
    }
  });
}

export function useStopTimer(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input?: { technicianId?: string; notes?: string }) =>
      api.post<TimeEntryResponse>(`/api/v1/jobs/${jobId}/time/stop`, input ?? {}),
    onSuccess: async () => {
      await invalidateJobQueries(queryClient, jobId);
    }
  });
}

export function useSendOTW(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendOnTheWayInput) => api.post<OnTheWayResponse>(`/api/v1/jobs/${jobId}/on-the-way`, input),
    onSuccess: async () => {
      await invalidateJobQueries(queryClient, jobId);
    }
  });
}

export function useJobOTW(jobId: string | null) {
  return useQuery({
    queryKey: jobId ? jobKeys.otw(jobId) : jobKeys.otw("pending"),
    queryFn: () => api.get<OnTheWayResponse>(`/api/v1/jobs/${jobId}/on-the-way`),
    enabled: Boolean(jobId)
  });
}

export function useCreateReviewRequest(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReviewRequestInput) =>
      api.post<ReviewRequestResponse>(`/api/v1/jobs/${jobId}/review-request`, input),
    onSuccess: async () => {
      await invalidateJobQueries(queryClient, jobId);
    }
  });
}

export function useJobAttachments(jobId: string | null) {
  return useQuery({
    queryKey: jobId ? jobKeys.attachments(jobId) : jobKeys.attachments("pending"),
    queryFn: () =>
      api.get<AttachmentListResponse>(`/api/v1/attachments?entityType=job&entityId=${jobId}&page=1&limit=100`),
    enabled: Boolean(jobId)
  });
}

export function useUploadAttachment(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UploadAttachmentInput) => uploadAttachmentRequest(jobId, input),
    onSuccess: async () => {
      await invalidateJobQueries(queryClient, jobId);
    }
  });
}

export function useDeleteAttachment(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: string) => api.delete<{ success: boolean }>(`/api/v1/attachments/${attachmentId}`),
    onSuccess: async () => {
      await invalidateJobQueries(queryClient, jobId);
    }
  });
}

export function useJobActivity(jobId: string | null) {
  return useQuery({
    queryKey: jobId ? jobKeys.activity(jobId) : jobKeys.activity("pending"),
    queryFn: () =>
      api.get<ActivityResponse>(`/api/v1/activity-events?entityType=job&entityId=${jobId}&page=1&limit=100`),
    enabled: Boolean(jobId)
  });
}

export function useCompany() {
  return useQuery({
    queryKey: ["company"],
    queryFn: () => api.get<CompanyResponse>("/api/v1/company"),
    staleTime: 5 * 60 * 1000
  });
}
