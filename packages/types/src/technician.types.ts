export type UserRole = "owner" | "admin" | "dispatcher" | "office" | "technician";

export type TechnicianStatus = "active" | "inactive" | "on_leave";

export interface Technician {
  id: string;
  companyId: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  avatarUrl: string | null;
  skills: string[] | null;
  serviceAreaIds: string[] | null;
  serviceZipCodes: string[] | null;
  hoursPerDay: string | null;
  totalJobsCompleted: number | null;
  avgJobDurationMinutes: number | null;
  estimateCloseRate: string | null;
  avgTicketValue: string | null;
  status: TechnicianStatus;
  calendarColor: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TechnicianDetail extends Technician {
  todayJobCount: number;
  activeJobCount: number;
}

export interface AvailabilitySlot {
  id: string;
  jobId: string | null;
  isBlockedTime: boolean | null;
  blockReason: string | null;
  startTime: Date;
  endTime: Date;
  isConfirmed: boolean | null;
}

export interface AvailabilityDay {
  date: string;
  totalBookedMinutes: number;
  availableMinutes: number;
  slots: AvailabilitySlot[];
}

export interface AvailabilityResult {
  technicianId: string;
  startDate: string;
  endDate: string;
  days: AvailabilityDay[];
}

export interface PerformanceSummary {
  technicianId: string;
  totalJobsCompleted: number;
  avgJobDurationMinutes: number | null;
  estimateCloseRate: string | null;
  avgTicketValue: string | null;
  last30Days: {
    jobsCompleted: number;
    revenue: string;
    avgTicket: string;
  };
}

export interface CreateTechnicianInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  skills?: string[];
  serviceAreaIds?: string[];
  serviceZipCodes?: string[];
  hoursPerDay?: number;
  status?: TechnicianStatus;
  calendarColor?: string;
  notes?: string;
  userId?: string;
}

export interface UpdateTechnicianInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  skills?: string[];
  serviceAreaIds?: string[];
  serviceZipCodes?: string[];
  hoursPerDay?: number;
  status?: TechnicianStatus;
  calendarColor?: string;
  notes?: string;
  userId?: string;
}

export interface ListTechniciansQuery {
  status?: TechnicianStatus;
  skills?: string[];
  sortBy?: "firstName" | "totalJobsCompleted" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
