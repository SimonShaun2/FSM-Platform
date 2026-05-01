export const SETTINGS_TIMEZONE_OPTIONS = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu"
] as const;

export const SETTINGS_CURRENCY_OPTIONS = [
  { value: "USD", label: "USD - United States Dollar" },
  { value: "CAD", label: "CAD - Canadian Dollar" }
] as const;

export const BOOKING_DAY_OPTIONS = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" }
] as const;

export const BOOKING_SERVICE_PRESETS = [
  {
    label: "Heating & Cooling",
    types: ["Repair", "Maintenance / Tune-Up", "New Installation", "Free Estimate"]
  },
  {
    label: "Plumbing",
    types: ["Repair", "Maintenance", "Emergency", "Inspection"]
  },
  {
    label: "Electrical",
    types: ["Repair", "Inspection", "Install", "Troubleshooting"]
  }
] as const;

export const AUTOMATION_RULE_COPY = {
  estimate_follow_up: {
    name: "Estimate follow-up",
    description: "Nudge customers after estimates that have not been approved or declined.",
    trigger: "Runs after an estimate sits without response."
  },
  invoice_recovery: {
    name: "Invoice recovery",
    description: "Escalate overdue invoices with payment reminders and AI-assisted recovery.",
    trigger: "Runs when invoices cross overdue thresholds."
  },
  invoice_overdue: {
    name: "Invoice reminders",
    description: "Send reminder sequences before and after an invoice turns overdue.",
    trigger: "Runs around due dates and overdue aging."
  },
  dormant_customer: {
    name: "Dormant customer scan",
    description: "Surface customers who have gone quiet and may be ready for reactivation outreach.",
    trigger: "Runs on inactive customer cohorts."
  },
  review_request: {
    name: "Review request",
    description: "Automatically send review requests after completed work.",
    trigger: "Runs after qualifying jobs are marked complete."
  },
  maintenance_due: {
    name: "Revenue opportunities",
    description: "Flag customers due for service, plans, repairs, or replacement follow-up.",
    trigger: "Runs on service-due and missed-revenue signals."
  }
} as const;

export const COMPANY_NOTIFICATION_EVENT_COPY = [
  {
    key: "estimateFollowUp",
    label: "Estimate follow-up",
    description: "Notify the team when estimate follow-ups are triggered."
  },
  {
    key: "invoiceRecovery",
    label: "Invoice recovery",
    description: "Alert the team when overdue invoice recovery actions are generated."
  },
  {
    key: "reviewRequest",
    label: "Review requests",
    description: "Send notifications when review requests go out or need attention."
  },
  {
    key: "bookingRequest",
    label: "Booking requests",
    description: "Let the office know when online bookings arrive."
  },
  {
    key: "paymentReceived",
    label: "Payments received",
    description: "Notify the team whenever customer payments post successfully."
  },
  {
    key: "serviceDueAlert",
    label: "Service due alerts",
    description: "Surface reminders for upcoming maintenance and service due activity."
  }
] as const;
