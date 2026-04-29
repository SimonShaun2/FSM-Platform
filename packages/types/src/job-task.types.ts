export type JobTaskStatus = "pending" | "in_progress" | "completed" | "skipped";

export interface JobTask {
  id: string;
  companyId: string;
  jobId: string;
  assignedToId: string | null;
  title: string;
  description: string | null;
  status: JobTaskStatus;
  isRequired: boolean | null;
  completedAt: Date | null;
  completedById: string | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  sortOrder: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateTaskInput {
  assignedToId?: string;
  title: string;
  description?: string;
  isRequired?: boolean;
  estimatedMinutes?: number;
  actualMinutes?: number;
  sortOrder?: number;
  notes?: string;
}

export interface UpdateTaskInput {
  assignedToId?: string | null;
  title?: string;
  description?: string;
  status?: JobTaskStatus;
  isRequired?: boolean;
  estimatedMinutes?: number;
  actualMinutes?: number;
  sortOrder?: number;
  notes?: string;
}
