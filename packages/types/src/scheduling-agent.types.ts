import type { ConfirmBookingRequestInput, PreferredBookingWindow } from "./booking-request.types.js";

export type SchedulingNoAvailabilityCode =
  | "no_technicians_in_service_area"
  | "no_skill_match"
  | "no_open_windows"
  | "booking_not_pending";

export interface SchedulingNoAvailability {
  code: SchedulingNoAvailabilityCode;
  message: string;
}

export interface SchedulingOption {
  optionId: string;
  technicianId: string;
  scheduledStart: string;
  scheduledEnd: string;
  window: PreferredBookingWindow;
  durationMinutes: number;
  travelBufferMinutes: number;
  skillsMatch: boolean;
  matchedSkills: string[];
}

export interface SchedulingOptionsResult {
  bookingRequestId: string;
  timeZone: string;
  options: SchedulingOption[];
  noAvailability: SchedulingNoAvailability | null;
  /** False until an in-platform hold or confirm is written to Renvani SoR (FS-23). */
  commitmentRecorded: boolean;
}

export interface ListSchedulingOptionsQuery {
  startDate?: string;
}

export type SelectSchedulingOptionInput = ConfirmBookingRequestInput;

export type ConfirmSchedulingOptionInput = ConfirmBookingRequestInput;
