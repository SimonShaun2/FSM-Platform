export interface DispatchJobCard {
  id: string;
  jobNumber: string;
  title: string;
  status: string;
  scheduledStart: string;
  scheduledEnd: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  property: {
    addressLine1: string;
    city: string;
  } | null;
  estimatedValue: string | null;
}

export interface DispatchGap {
  start: string;
  end: string;
  durationMinutes: number;
}

export interface DispatchTechnicianDay {
  id: string;
  name: string;
  avatarUrl: string | null;
  serviceAreaIds: string[];
  serviceZipCodes: string[];
  utilization: number;
  hoursAvailable: number;
  hoursScheduled: number;
  jobs: DispatchJobCard[];
  gaps: DispatchGap[];
}

export interface DispatchNextBestJob {
  jobId: string;
  jobNumber: string;
  customer: string;
  estimatedValue: string | null;
  urgencyScore: number;
  suggestedTechId: string | null;
  reasoningText: string;
}

export interface DispatchView {
  date: string;
  technicians: DispatchTechnicianDay[];
  nextBestJobs: DispatchNextBestJob[];
}

export interface DispatchWorkloadRow {
  technicianId: string;
  technicianName: string;
  utilization: number;
  hoursAvailable: number;
  hoursScheduled: number;
  jobCount: number;
}

export interface AutoFitScoreBreakdown {
  zipMatch: number;
  skillsMatch: number;
  utilizationScore: number;
  gapFitScore: number;
}

export interface AutoFitSuggestion {
  technicianId: string;
  technicianName: string;
  scheduledStart: string;
  scheduledEnd: string;
  score: number;
  scoreBreakdown: AutoFitScoreBreakdown;
  reasoningText: string;
}

export interface AutoFitResponse {
  suggestions: AutoFitSuggestion[];
  message: string | null;
}

export interface UnscheduledJob {
  id: string;
  jobNumber: string;
  title: string;
  status: string;
  priority: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: Date;
}

export interface ApprovedUnconvertedEstimate {
  id: string;
  estimateNumber: string;
  title: string | null;
  total: string;
  approvedAt: Date | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
  };
}
