import type { PaginatedResult } from "./customer.types.js";

export type TimeEntryType = "travel" | "on_site" | "break";

export interface TimeEntry {
  id: string;
  companyId: string;
  jobId: string;
  technicianId: string;
  startedAt: Date;
  endedAt: Date | null;
  durationMinutes: number | null;
  entryType: TimeEntryType | null;
  notes: string | null;
  travelFromAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface StartTimeEntryInput {
  technicianId?: string;
  entryType?: TimeEntryType;
  notes?: string;
  travelFromAddress?: string;
}

export interface StopTimeEntryInput {
  technicianId?: string;
  notes?: string;
}

export interface UpdateTimeEntryInput {
  startedAt?: string;
  endedAt?: string | null;
  entryType?: TimeEntryType;
  notes?: string;
  travelFromAddress?: string;
}

export interface ListTechnicianTimeQuery {
  startDate?: string;
  endDate?: string;
  jobId?: string;
  page?: number;
  limit?: number;
}

export type TechnicianTimeResult = PaginatedResult<TimeEntry>;
