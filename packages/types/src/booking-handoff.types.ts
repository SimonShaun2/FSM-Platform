export type BookingHandoffStatus = "pending_external" | "succeeded" | "failed";

export interface BookingHandoff {
  id: string;
  companyId: string;
  bookingRequestId: string;
  targetSystem: string;
  status: BookingHandoffStatus;
  externalReference: string | null;
  failureReason: string | null;
  operatorNotes: string | null;
  initiatedById: string;
  reconciledById: string | null;
  reconciledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface InitiateBookingHandoffInput {
  targetSystem: string;
  operatorNotes?: string;
}

export interface ReconcileBookingHandoffInput {
  outcome: "succeeded" | "failed";
  externalReference?: string;
  failureReason?: string;
}
