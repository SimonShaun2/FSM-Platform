/**
 * FSM v1 — Full Schema
 * Drizzle ORM + Postgres
 *
 * Architecture: Customer → Property → Asset → Job → Events → AI
 *
 * Table groups:
 *   1. Foundation (company, users, roles)
 *   2. Customer Graph (customer, property, asset)
 *   3. Workforce (technician, service_area)
 *   4. Job Lifecycle (job, job_note, job_photo)
 *   5. Estimates (estimate, estimate_item)
 *   6. Invoices & Payments (invoice, invoice_item, payment)
 *   7. Maintenance Plans → Service Agreements (maintenance_plan, maintenance_visit, service_agreement_template)
 *   8. Scheduling (schedule_slot)
 *   9. Activity Events (activity_event)
 *  10. AI Layer (ai_recommendation, campaign, campaign_recipient)
 *  11. Messaging (message_log)
 *  12. Forms (form_template, form_submission)
 *  13. Onboarding (import_session)
 */

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  integer,
  decimal,
  boolean,
  timestamp,
  date,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────

const timestamps = {
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"), // soft delete
};

const id = () => uuid("id").primaryKey().defaultRandom();

const companyId = () =>
  uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" });

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "owner",
  "admin",
  "dispatcher",
  "office",
  "technician",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "lead",
  "estimate_requested",
  "estimate_sent",
  "estimate_approved",
  "scheduled",
  "dispatched",
  "in_progress",
  "on_hold",
  "completed",
  "invoiced",
  "paid",
  "cancelled",
  "closed",
]);

export const jobPriorityEnum = pgEnum("job_priority", [
  "low",
  "normal",
  "high",
  "urgent",
]);

export const jobTypeEnum = pgEnum("job_type", [
  "service_call",
  "maintenance",
  "installation",
  "inspection",
  "estimate_only",
  "warranty",
  "callback",
  "emergency",
]);

export const estimateStatusEnum = pgEnum("estimate_status", [
  "draft",
  "sent",
  "viewed",
  "approved",
  "declined",
  "expired",
  "converted",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "viewed",
  "partially_paid",
  "paid",
  "overdue",
  "void",
  "written_off",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "card",
  "ach",
  "cash",
  "check",
  "financing",
  "other",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "succeeded",
  "failed",
  "refunded",
  "disputed",
]);

export const propertyTypeEnum = pgEnum("property_type", [
  "residential",
  "commercial",
  "industrial",
  "multi_family",
]);

export const assetConditionEnum = pgEnum("asset_condition", [
  "excellent",
  "good",
  "fair",
  "poor",
  "failed",
]);

export const maintenancePlanStatusEnum = pgEnum("maintenance_plan_status", [
  "active",
  "paused",
  "expired",
  "cancelled",
]);

export const maintenancePlanFrequencyEnum = pgEnum(
  "maintenance_plan_frequency",
  ["monthly", "bi_monthly", "quarterly", "bi_annual", "annual"]
);

export const serviceAgreementBillingCycleEnum = pgEnum(
  "service_agreement_billing_cycle",
  ["monthly", "annual"]
);

export const formTypeEnum = pgEnum("form_type", [
  "job_checklist",
  "maintenance_checklist",
  "inspection_report",
  "customer_intake",
  "install_checklist",
  "safety_checklist",
  "custom",
]);

export const importSessionStatusEnum = pgEnum("import_session_status", [
  "uploaded",
  "mapping",
  "preview",
  "importing",
  "completed",
  "failed",
  "rolled_back",
]);

export const importEntityTypeEnum = pgEnum("import_entity_type", [
  "customers",
  "properties",
  "assets",
  "jobs",
  "estimates",
  "invoices",
]);

export const technicianStatusEnum = pgEnum("technician_status", [
  "active",
  "inactive",
  "on_leave",
]);

export const activityEventTypeEnum = pgEnum("activity_event_type", [
  // Authentication & company
  "company.created",
  "company.updated",
  "user.registered",
  "user.login",
  "user.logout",
  "user.password_reset",
  // Customer
  "customer.created",
  "customer.updated",
  "customer.deleted",
  "customer.merged",
  // Property
  "property.created",
  "property.updated",
  "property.deleted",
  // Asset
  "asset.created",
  "asset.updated",
  "asset.deleted",
  "asset.serviced",
  // Job
  "job.created",
  "job.updated",
  "job.scheduled",
  "job.dispatched",
  "job.started",
  "job.paused",
  "job.completed",
  "job.reopened",
  "job.rescheduled",
  "job.cancelled",
  "job.closed",
  // Estimate
  "estimate.created",
  "estimate.sent",
  "estimate.viewed",
  "estimate.approved",
  "estimate.declined",
  "estimate.expired",
  "estimate.revised",
  // Invoice
  "invoice.created",
  "invoice.sent",
  "invoice.viewed",
  "invoice.overdue",
  "invoice.void",
  // Payment
  "payment.received",
  "payment.partial",
  "payment.failed",
  "payment.refunded",
  // Technician
  "technician.created",
  "technician.updated",
  "technician.deleted",
  "technician.assigned",
  "technician.unassigned",
  // Maintenance plan
  "maintenance_plan.created",
  "maintenance_plan.renewed",
  "maintenance_plan.cancelled",
  "maintenance_visit.completed",
  // AI
  "ai.recommendation_created",
  "ai.recommendation_actioned",
  "ai.recommendation_dismissed",
  // Campaign
  "campaign.sent",
  "campaign.opened",
  "campaign.replied",
  // Message
  "message.sent",
  "message.received",
]);

export const aiRecommendationTypeEnum = pgEnum("ai_recommendation_type", [
  "reactivation",
  "aging_asset",
  "maintenance_due",
  "unsold_estimate",
  "unpaid_invoice",
  "upsell_opportunity",
  "seasonal_campaign",
  "maintenance_plan_offer",
]);

export const aiRecommendationStatusEnum = pgEnum("ai_recommendation_status", [
  "pending",
  "actioned",
  "dismissed",
  "snoozed",
  "expired",
]);

export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "scheduled",
  "sending",
  "sent",
  "cancelled",
]);

export const campaignTypeEnum = pgEnum("campaign_type", [
  "reactivation",
  "estimate_follow_up",
  "invoice_reminder",
  "seasonal",
  "maintenance_reminder",
  "custom",
]);

export const messageChannelEnum = pgEnum("message_channel", [
  "sms",
  "email",
  "in_app",
]);

export const messageDirectionEnum = pgEnum("message_direction", [
  "outbound",
  "inbound",
]);

// ─────────────────────────────────────────────
// 1. FOUNDATION
// ─────────────────────────────────────────────

export const companies = pgTable("companies", {
  id: id(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  logoUrl: text("logo_url"),
  addressLine1: varchar("address_line_1", { length: 255 }),
  addressLine2: varchar("address_line_2", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zip: varchar("zip", { length: 20 }),
  country: varchar("country", { length: 50 }).notNull().default("US"),
  timezone: varchar("timezone", { length: 60 }).notNull().default("America/Chicago"),
  // Stripe
  stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),
  stripeAccountId: varchar("stripe_account_id", { length: 100 }), // Connect for payments
  // Settings
  settings: jsonb("settings").default({}),
  ...timestamps,
}, (t) => ({
  slugIdx: uniqueIndex("companies_slug_idx").on(t.slug),
}));

export const users = pgTable("users", {
  id: id(),
  companyId: companyId(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: text("password_hash"),
  passwordChangedAt: timestamp("password_changed_at"),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  role: userRoleEnum("role").notNull().default("office"),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  // If this user is also a technician
  technicianId: uuid("technician_id"),
  ...timestamps,
}, (t) => ({
  emailIdx: uniqueIndex("users_email_idx").on(t.email),
  emailCompanyIdx: uniqueIndex("users_email_company_idx").on(t.email, t.companyId),
  companyIdx: index("users_company_idx").on(t.companyId),
}));

export const refreshTokens = pgTable("refresh_tokens", {
  id: id(),
  companyId: companyId(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  companyIdx: index("refresh_tokens_company_idx").on(t.companyId),
  userIdx: index("refresh_tokens_user_idx").on(t.userId),
  expiresAtIdx: index("refresh_tokens_expires_at_idx").on(t.expiresAt),
}));

export const serviceAreas = pgTable("service_areas", {
  id: id(),
  companyId: companyId(),
  name: varchar("name", { length: 100 }).notNull(),
  zips: text("zips").array(), // zip codes covered
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

// ─────────────────────────────────────────────
// 2. CUSTOMER GRAPH
// ─────────────────────────────────────────────

export const customers = pgTable("customers", {
  id: id(),
  companyId: companyId(),
  // Identity
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 255 }), // business name override
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 30 }),
  altPhone: varchar("alt_phone", { length: 30 }),
  // Source
  leadSource: varchar("lead_source", { length: 100 }), // google, referral, door_hanger, etc
  referredBy: uuid("referred_by"), // customer_id
  // Tags + notes
  tags: text("tags").array().default([]),
  internalNotes: text("internal_notes"),
  // Computed / denormalized for AI queries (updated on job completion)
  lifetimeValue: decimal("lifetime_value", { precision: 10, scale: 2 }).default("0"),
  totalJobs: integer("total_jobs").default(0),
  lastServiceDate: date("last_service_date"),
  firstServiceDate: date("first_service_date"),
  // Comms preferences
  prefersSms: boolean("prefers_sms").default(true),
  prefersEmail: boolean("prefers_email").default(true),
  doNotContact: boolean("do_not_contact").default(false),
  // Stripe
  stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),
  ...timestamps,
}, (t) => ({
  companyIdx: index("customers_company_idx").on(t.companyId),
  emailIdx: index("customers_email_idx").on(t.email),
  lastServiceIdx: index("customers_last_service_idx").on(t.lastServiceDate),
}));

export const properties = pgTable("properties", {
  id: id(),
  companyId: companyId(),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  // Address
  addressLine1: varchar("address_line_1", { length: 255 }).notNull(),
  addressLine2: varchar("address_line_2", { length: 255 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  zip: varchar("zip", { length: 20 }).notNull(),
  country: varchar("country", { length: 50 }).default("US"),
  // Geo (for routing later)
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  // Property details
  type: propertyTypeEnum("type").notNull().default("residential"),
  sqft: integer("sqft"),
  yearBuilt: integer("year_built"),
  accessNotes: text("access_notes"), // gate codes, dogs, etc
  notes: text("notes"),
  isPrimary: boolean("is_primary").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
}, (t) => ({
  customerIdx: index("properties_customer_idx").on(t.customerId),
  companyIdx: index("properties_company_idx").on(t.companyId),
  zipIdx: index("properties_zip_idx").on(t.zip),
}));

export const assets = pgTable("assets", {
  id: id(),
  companyId: companyId(),
  propertyId: uuid("property_id").notNull().references(() => properties.id),
  customerId: uuid("customer_id").notNull().references(() => customers.id), // denorm for fast queries
  // Identity
  name: varchar("name", { length: 255 }).notNull(), // "Main HVAC Unit", "Water Heater #1"
  assetType: varchar("asset_type", { length: 100 }).notNull(), // hvac, water_heater, electrical_panel, etc
  brand: varchar("brand", { length: 100 }),
  model: varchar("model", { length: 100 }),
  serialNumber: varchar("serial_number", { length: 100 }),
  // Age / service history
  installDate: date("install_date"),
  warrantyExpiration: date("warranty_expiration"),
  lastServiceDate: date("last_service_date"),
  nextServiceDate: date("next_service_date"), // computed from maintenance plan or job
  // Condition (manual until AI takes over)
  condition: assetConditionEnum("condition"),
  conditionNotes: text("condition_notes"),
  // AI scoring (v1.5+, column present but nullable)
  conditionScore: integer("condition_score"), // 0–100
  replacementProbability: decimal("replacement_probability", { precision: 5, scale: 4 }), // 0.0000–1.0000
  // Photos
  photoUrls: text("photo_urls").array().default([]),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
}, (t) => ({
  propertyIdx: index("assets_property_idx").on(t.propertyId),
  customerIdx: index("assets_customer_idx").on(t.customerId),
  companyIdx: index("assets_company_idx").on(t.companyId),
  typeIdx: index("assets_type_idx").on(t.assetType),
  warrantyIdx: index("assets_warranty_idx").on(t.warrantyExpiration),
  installIdx: index("assets_install_idx").on(t.installDate),
}));

// ─────────────────────────────────────────────
// 3. WORKFORCE
// ─────────────────────────────────────────────

export const technicians = pgTable("technicians", {
  id: id(),
  companyId: companyId(),
  userId: uuid("user_id").references(() => users.id), // nullable — tech may not have login yet
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 30 }).notNull(),
  avatarUrl: text("avatar_url"),
  // Skills + capacity
  skills: text("skills").array().default([]), // hvac, plumbing, electrical
  serviceAreaIds: uuid("service_area_ids").array().default([]),
  hoursPerDay: decimal("hours_per_day", { precision: 4, scale: 2 }).default("8"),
  // Performance (updated on job completion)
  totalJobsCompleted: integer("total_jobs_completed").default(0),
  avgJobDurationMinutes: integer("avg_job_duration_minutes"),
  estimateCloseRate: decimal("estimate_close_rate", { precision: 5, scale: 4 }),
  avgTicketValue: decimal("avg_ticket_value", { precision: 10, scale: 2 }),
  // Status
  status: technicianStatusEnum("status").notNull().default("active"),
  // Color for dispatch board
  calendarColor: varchar("calendar_color", { length: 7 }).default("#6366f1"),
  notes: text("notes"),
  ...timestamps,
}, (t) => ({
  companyIdx: index("technicians_company_idx").on(t.companyId),
}));

// ─────────────────────────────────────────────
// 4. JOB LIFECYCLE
// ─────────────────────────────────────────────

export const jobs = pgTable("jobs", {
  id: id(),
  companyId: companyId(),
  // Job number (human-readable, company-scoped)
  jobNumber: varchar("job_number", { length: 30 }).notNull(),
  // Relationships
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  propertyId: uuid("property_id").references(() => properties.id),
  assetId: uuid("asset_id").references(() => assets.id), // primary asset
  technicianId: uuid("technician_id").references(() => technicians.id),
  assignedById: uuid("assigned_by_id").references(() => users.id),
  // Classification
  type: jobTypeEnum("type").notNull().default("service_call"),
  priority: jobPriorityEnum("priority").notNull().default("normal"),
  status: jobStatusEnum("status").notNull().default("lead"),
  // Source
  leadSource: varchar("lead_source", { length: 100 }),
  // Description
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  // Scheduling
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  scheduledDurationMinutes: integer("scheduled_duration_minutes"),
  // Actuals
  actualStart: timestamp("actual_start"),
  actualEnd: timestamp("actual_end"),
  // On-site
  techNotes: text("tech_notes"),
  completionNotes: text("completion_notes"),
  signatureUrl: text("signature_url"),
  signedAt: timestamp("signed_at"),
  signedByName: varchar("signed_by_name", { length: 255 }),
  // Financials (denorm for fast dashboard queries)
  estimateTotal: decimal("estimate_total", { precision: 10, scale: 2 }),
  invoiceTotal: decimal("invoice_total", { precision: 10, scale: 2 }),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0"),
  // Linked entities
  maintenancePlanId: uuid("maintenance_plan_id"),
  parentJobId: uuid("parent_job_id"), // for return visits / follow-up jobs
  // Tags
  tags: text("tags").array().default([]),
  ...timestamps,
}, (t) => ({
  companyIdx: index("jobs_company_idx").on(t.companyId),
  customerIdx: index("jobs_customer_idx").on(t.customerId),
  technicianIdx: index("jobs_technician_idx").on(t.technicianId),
  statusIdx: index("jobs_status_idx").on(t.status),
  scheduledStartIdx: index("jobs_scheduled_start_idx").on(t.scheduledStart),
  jobNumberIdx: uniqueIndex("jobs_job_number_company_idx").on(t.jobNumber, t.companyId),
}));

export const jobNotes = pgTable("job_notes", {
  id: id(),
  companyId: companyId(),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").references(() => users.id),
  // null authorId = system/AI note
  content: text("content").notNull(),
  isInternal: boolean("is_internal").notNull().default(true),
  ...timestamps,
});

export const jobPhotos = pgTable("job_photos", {
  id: id(),
  companyId: companyId(),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  uploadedById: uuid("uploaded_by_id").references(() => users.id),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  caption: text("caption"),
  takenAt: timestamp("taken_at"),
  // before / after / general
  photoType: varchar("photo_type", { length: 30 }).default("general"),
  ...timestamps,
});

// ─────────────────────────────────────────────
// 5. ESTIMATES
// ─────────────────────────────────────────────

export const estimates = pgTable("estimates", {
  id: id(),
  companyId: companyId(),
  estimateNumber: varchar("estimate_number", { length: 30 }).notNull(),
  jobId: uuid("job_id").references(() => jobs.id),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  propertyId: uuid("property_id").references(() => properties.id),
  createdById: uuid("created_by_id").references(() => users.id),
  status: estimateStatusEnum("status").notNull().default("draft"),
  // Tiers — good / better / best
  // Each tier is a separate estimate row; selectedTierId links them
  tierLabel: varchar("tier_label", { length: 50 }), // "Good", "Better", "Best", null if single
  tierGroupId: uuid("tier_group_id"), // groups the 3 tiers together
  isSelectedTier: boolean("is_selected_tier").default(false),
  // Totals (computed from items)
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 4 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0"),
  // Customer-facing
  title: varchar("title", { length: 255 }),
  messageToCustomer: text("message_to_customer"),
  internalNotes: text("internal_notes"),
  // Approval
  approvalToken: varchar("approval_token", { length: 100 }), // for public link
  approvedAt: timestamp("approved_at"),
  approvedByName: varchar("approved_by_name", { length: 255 }),
  approvedSignatureUrl: text("approved_signature_url"),
  declinedAt: timestamp("declined_at"),
  declineReason: text("decline_reason"),
  // Follow-up
  expiresAt: timestamp("expires_at"),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  followUpSentAt: timestamp("follow_up_sent_at"),
  // Financing
  financingOffered: boolean("financing_offered").default(false),
  ...timestamps,
}, (t) => ({
  companyIdx: index("estimates_company_idx").on(t.companyId),
  customerIdx: index("estimates_customer_idx").on(t.customerId),
  statusIdx: index("estimates_status_idx").on(t.status),
  tokenIdx: uniqueIndex("estimates_approval_token_idx").on(t.approvalToken),
  numberIdx: uniqueIndex("estimates_number_company_idx").on(t.estimateNumber, t.companyId),
}));

export const estimateItems = pgTable("estimate_items", {
  id: id(),
  estimateId: uuid("estimate_id").notNull().references(() => estimates.id, { onDelete: "cascade" }),
  companyId: companyId(),
  // Item
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  itemType: varchar("item_type", { length: 30 }).notNull().default("service"), // service, labor, material, fee
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull().default("1"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  isTaxable: boolean("is_taxable").default(true),
  sortOrder: integer("sort_order").default(0),
  ...timestamps,
});

// ─────────────────────────────────────────────
// 6. INVOICES & PAYMENTS
// ─────────────────────────────────────────────

export const invoices = pgTable("invoices", {
  id: id(),
  companyId: companyId(),
  invoiceNumber: varchar("invoice_number", { length: 30 }).notNull(),
  jobId: uuid("job_id").references(() => jobs.id),
  estimateId: uuid("estimate_id").references(() => estimates.id),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  createdById: uuid("created_by_id").references(() => users.id),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  // Totals
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 4 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0"),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0"),
  balanceDue: decimal("balance_due", { precision: 10, scale: 2 }).notNull().default("0"),
  // Dates
  issuedAt: timestamp("issued_at"),
  dueAt: timestamp("due_at"),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  paidAt: timestamp("paid_at"),
  // Payment link (Stripe)
  stripePaymentLinkId: varchar("stripe_payment_link_id", { length: 100 }),
  stripePaymentLinkUrl: text("stripe_payment_link_url"),
  paymentToken: varchar("payment_token", { length: 100 }),
  // Reminders
  reminder1SentAt: timestamp("reminder_1_sent_at"),
  reminder2SentAt: timestamp("reminder_2_sent_at"),
  reminder3SentAt: timestamp("reminder_3_sent_at"),
  // Notes
  messageToCustomer: text("message_to_customer"),
  internalNotes: text("internal_notes"),
  ...timestamps,
}, (t) => ({
  companyIdx: index("invoices_company_idx").on(t.companyId),
  customerIdx: index("invoices_customer_idx").on(t.customerId),
  statusIdx: index("invoices_status_idx").on(t.status),
  dueIdx: index("invoices_due_idx").on(t.dueAt),
  numberIdx: uniqueIndex("invoices_number_company_idx").on(t.invoiceNumber, t.companyId),
}));

export const invoiceItems = pgTable("invoice_items", {
  id: id(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  companyId: companyId(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  itemType: varchar("item_type", { length: 30 }).notNull().default("service"),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull().default("1"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  isTaxable: boolean("is_taxable").default(true),
  sortOrder: integer("sort_order").default(0),
  ...timestamps,
});

export const payments = pgTable("payments", {
  id: id(),
  companyId: companyId(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  collectedById: uuid("collected_by_id").references(() => users.id),
  // Amounts
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: paymentMethodEnum("method").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  // Stripe
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 100 }),
  stripeChargeId: varchar("stripe_charge_id", { length: 100 }),
  // Manual payment details
  checkNumber: varchar("check_number", { length: 50 }),
  referenceNumber: varchar("reference_number", { length: 100 }),
  notes: text("notes"),
  paidAt: timestamp("paid_at"),
  ...timestamps,
}, (t) => ({
  companyIdx: index("payments_company_idx").on(t.companyId),
  invoiceIdx: index("payments_invoice_idx").on(t.invoiceId),
  stripeIntentIdx: index("payments_stripe_intent_idx").on(t.stripePaymentIntentId),
}));

// ─────────────────────────────────────────────
// 7. SERVICE AGREEMENTS (MAINTENANCE PLANS)
// ─────────────────────────────────────────────

// Service Agreement Templates — the plan products the company sells
// e.g. "Silver Plan", "Gold Plan", "Platinum Plan"
// Company defines these once; customers are enrolled into instances (maintenancePlans)
export const serviceAgreementTemplates = pgTable("service_agreement_templates", {
  id: id(),
  companyId: companyId(),
  name: varchar("name", { length: 255 }).notNull(), // "Gold Maintenance Plan"
  description: text("description"),
  // What's included
  includedServices: text("included_services").array().default([]),
  visitsPerYear: integer("visits_per_year").notNull().default(2),
  frequency: maintenancePlanFrequencyEnum("frequency").notNull().default("bi_annual"),
  // Pricing
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }),
  annualPrice: decimal("annual_price", { precision: 10, scale: 2 }),
  // Stripe Price IDs — one per billing cycle, created in Stripe dashboard
  stripeMthlyPriceId: varchar("stripe_mthly_price_id", { length: 100 }),
  stripeAnnualPriceId: varchar("stripe_annual_price_id", { length: 100 }),
  // Display + filtering
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").notNull().default(true),
  applicableAssetTypes: text("applicable_asset_types").array().default([]), // ["hvac", "water_heater"]
  notes: text("notes"),
  ...timestamps,
}, (t) => ({
  companyIdx: index("service_agreement_templates_company_idx").on(t.companyId),
  activeIdx: index("service_agreement_templates_active_idx").on(t.isActive),
}));

export const maintenancePlans = pgTable("maintenance_plans", {
  id: id(),
  companyId: companyId(),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  propertyId: uuid("property_id").references(() => properties.id),
  // Template this plan was created from (nullable — plan may be one-off custom)
  serviceAgreementTemplateId: uuid("service_agreement_template_id")
    .references(() => serviceAgreementTemplates.id),
  // Plan definition
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  includedServices: text("included_services").array().default([]),
  frequency: maintenancePlanFrequencyEnum("frequency").notNull(),
  status: maintenancePlanStatusEnum("status").notNull().default("active"),
  // Pricing
  price: decimal("price", { precision: 10, scale: 2 }),
  billingCycle: serviceAgreementBillingCycleEnum("billing_cycle").default("annual"),
  // Stripe recurring billing
  // When a plan has recurring billing, a Stripe Subscription is created.
  // Stripe handles renewal, dunning, and cancellation automatically.
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
  stripePriceId: varchar("stripe_price_id", { length: 100 }),
  stripeCurrentPeriodStart: timestamp("stripe_current_period_start"),
  stripeCurrentPeriodEnd: timestamp("stripe_current_period_end"),
  stripeCancelAtPeriodEnd: boolean("stripe_cancel_at_period_end").default(false),
  // Dates
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  nextServiceDate: date("next_service_date"),
  lastServiceDate: date("last_service_date"),
  // Assets covered under this plan
  assetIds: uuid("asset_ids").array().default([]),
  notes: text("notes"),
  ...timestamps,
}, (t) => ({
  companyIdx: index("maintenance_plans_company_idx").on(t.companyId),
  customerIdx: index("maintenance_plans_customer_idx").on(t.customerId),
  nextServiceIdx: index("maintenance_plans_next_service_idx").on(t.nextServiceDate),
  statusIdx: index("maintenance_plans_status_idx").on(t.status),
  stripeSubIdx: index("maintenance_plans_stripe_sub_idx").on(t.stripeSubscriptionId),
}));

export const maintenanceVisits = pgTable("maintenance_visits", {
  id: id(),
  companyId: companyId(),
  maintenancePlanId: uuid("maintenance_plan_id").notNull().references(() => maintenancePlans.id),
  jobId: uuid("job_id").references(() => jobs.id), // job created for this visit
  scheduledDate: date("scheduled_date"),
  completedDate: date("completed_date"),
  notes: text("notes"),
  ...timestamps,
});

// ─────────────────────────────────────────────
// 8. SCHEDULING
// ─────────────────────────────────────────────

export const scheduleSlots = pgTable("schedule_slots", {
  id: id(),
  companyId: companyId(),
  technicianId: uuid("technician_id").notNull().references(() => technicians.id),
  jobId: uuid("job_id").references(() => jobs.id),
  // Blocked time (no job — meeting, PTO, lunch, etc.)
  isBlockedTime: boolean("is_blocked_time").default(false),
  blockReason: varchar("block_reason", { length: 100 }),
  // Times
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  // Travel
  travelMinutesBefore: integer("travel_minutes_before").default(0),
  // Status
  isConfirmed: boolean("is_confirmed").default(false),
  notes: text("notes"),
  ...timestamps,
}, (t) => ({
  technicianIdx: index("schedule_slots_technician_idx").on(t.technicianId),
  startTimeIdx: index("schedule_slots_start_time_idx").on(t.startTime),
  jobIdx: index("schedule_slots_job_idx").on(t.jobId),
}));

// ─────────────────────────────────────────────
// 9. ACTIVITY EVENTS
// ─────────────────────────────────────────────

export const activityEvents = pgTable("activity_events", {
  id: id(),
  companyId: companyId(),
  // What happened
  eventType: activityEventTypeEnum("event_type").notNull(),
  // Who did it
  actorId: uuid("actor_id"), // user_id or null for system/AI
  actorType: varchar("actor_type", { length: 30 }).default("user"), // user | system | ai | customer
  actorName: varchar("actor_name", { length: 255 }), // denorm for display
  // What it happened to
  entityType: varchar("entity_type", { length: 50 }).notNull(), // job, customer, invoice, etc.
  entityId: uuid("entity_id").notNull(),
  // Context links (for timeline display on any object)
  customerId: uuid("customer_id"),
  jobId: uuid("job_id"),
  estimateId: uuid("estimate_id"),
  invoiceId: uuid("invoice_id"),
  // Payload — state change details, metadata, etc.
  payload: jsonb("payload").default({}),
  // Human-readable summary for timeline display
  summary: text("summary").notNull(),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
}, (t) => ({
  companyIdx: index("activity_events_company_idx").on(t.companyId),
  entityIdx: index("activity_events_entity_idx").on(t.entityType, t.entityId),
  customerIdx: index("activity_events_customer_idx").on(t.customerId),
  jobIdx: index("activity_events_job_idx").on(t.jobId),
  eventTypeIdx: index("activity_events_event_type_idx").on(t.eventType),
  occurredAtIdx: index("activity_events_occurred_at_idx").on(t.occurredAt),
}));

// ─────────────────────────────────────────────
// 10. AI LAYER
// ─────────────────────────────────────────────

export const aiRecommendations = pgTable("ai_recommendations", {
  id: id(),
  companyId: companyId(),
  type: aiRecommendationTypeEnum("type").notNull(),
  status: aiRecommendationStatusEnum("status").notNull().default("pending"),
  // Target
  customerId: uuid("customer_id").references(() => customers.id),
  propertyId: uuid("property_id").references(() => properties.id),
  assetId: uuid("asset_id").references(() => assets.id),
  jobId: uuid("job_id").references(() => jobs.id),
  estimateId: uuid("estimate_id").references(() => estimates.id),
  invoiceId: uuid("invoice_id").references(() => invoices.id),
  // Revenue opportunity
  estimatedRevenue: decimal("estimated_revenue", { precision: 10, scale: 2 }),
  // AI-generated content
  headline: varchar("headline", { length: 255 }).notNull(),
  body: text("body").notNull(),
  suggestedAction: varchar("suggested_action", { length: 100 }), // send_sms, create_job, call, etc.
  suggestedMessage: text("suggested_message"), // pre-drafted SMS/email copy
  // Scoring
  urgencyScore: integer("urgency_score"), // 0–100
  confidenceScore: integer("confidence_score"), // 0–100
  // Lifecycle
  actionedAt: timestamp("actioned_at"),
  actionedById: uuid("actioned_by_id").references(() => users.id),
  dismissedAt: timestamp("dismissed_at"),
  snoozedUntil: timestamp("snoozed_until"),
  expiresAt: timestamp("expires_at"),
  // Source events that triggered this recommendation
  sourceEventIds: uuid("source_event_ids").array().default([]),
  ...timestamps,
}, (t) => ({
  companyIdx: index("ai_recommendations_company_idx").on(t.companyId),
  typeIdx: index("ai_recommendations_type_idx").on(t.type),
  statusIdx: index("ai_recommendations_status_idx").on(t.status),
  customerIdx: index("ai_recommendations_customer_idx").on(t.customerId),
  urgencyIdx: index("ai_recommendations_urgency_idx").on(t.urgencyScore),
}));

export const campaigns = pgTable("campaigns", {
  id: id(),
  companyId: companyId(),
  createdById: uuid("created_by_id").references(() => users.id),
  type: campaignTypeEnum("type").notNull(),
  status: campaignStatusEnum("status").notNull().default("draft"),
  name: varchar("name", { length: 255 }).notNull(),
  // Content
  subject: varchar("subject", { length: 255 }), // email subject
  body: text("body").notNull(),
  channel: messageChannelEnum("channel").notNull().default("sms"),
  // AI-generated flag
  isAiGenerated: boolean("is_ai_generated").default(false),
  aiRecommendationId: uuid("ai_recommendation_id").references(() => aiRecommendations.id),
  // Scheduling
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  // Metrics
  recipientCount: integer("recipient_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  openedCount: integer("opened_count").default(0),
  repliedCount: integer("replied_count").default(0),
  convertedCount: integer("converted_count").default(0),
  revenueAttributed: decimal("revenue_attributed", { precision: 10, scale: 2 }).default("0"),
  ...timestamps,
}, (t) => ({
  companyIdx: index("campaigns_company_idx").on(t.companyId),
  statusIdx: index("campaigns_status_idx").on(t.status),
}));

export const campaignRecipients = pgTable("campaign_recipients", {
  id: id(),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  companyId: companyId(),
  // Delivery
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  repliedAt: timestamp("replied_at"),
  // Conversion
  convertedAt: timestamp("converted_at"),
  conversionJobId: uuid("conversion_job_id").references(() => jobs.id),
  // Contact used
  sentToPhone: varchar("sent_to_phone", { length: 30 }),
  sentToEmail: varchar("sent_to_email", { length: 255 }),
  // Unsubscribe
  unsubscribedAt: timestamp("unsubscribed_at"),
  ...timestamps,
});

// ─────────────────────────────────────────────
// 11. MESSAGING
// ─────────────────────────────────────────────

export const messageLogs = pgTable("message_logs", {
  id: id(),
  companyId: companyId(),
  customerId: uuid("customer_id").references(() => customers.id),
  jobId: uuid("job_id").references(() => jobs.id),
  campaignId: uuid("campaign_id").references(() => campaigns.id),
  channel: messageChannelEnum("channel").notNull(),
  direction: messageDirectionEnum("direction").notNull(),
  // Content
  toAddress: varchar("to_address", { length: 255 }).notNull(), // phone or email
  fromAddress: varchar("from_address", { length: 255 }),
  subject: varchar("subject", { length: 255 }),
  body: text("body").notNull(),
  // Provider
  providerMessageId: varchar("provider_message_id", { length: 255 }), // Twilio SID / SendGrid ID
  providerStatus: varchar("provider_status", { length: 50 }),
  // Delivery
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  failedAt: timestamp("failed_at"),
  failureReason: text("failure_reason"),
  ...timestamps,
}, (t) => ({
  companyIdx: index("message_logs_company_idx").on(t.companyId),
  customerIdx: index("message_logs_customer_idx").on(t.customerId),
  jobIdx: index("message_logs_job_idx").on(t.jobId),
}));

// ─────────────────────────────────────────────
// 12. FORMS
// ─────────────────────────────────────────────

// Form templates — defined at the company level, reused across jobs
// v1 ships with pre-built HVAC templates; custom form builder is v2
export const formTemplates = pgTable("form_templates", {
  id: id(),
  companyId: companyId(),
  name: varchar("name", { length: 255 }).notNull(), // "HVAC Maintenance Checklist"
  formType: formTypeEnum("form_type").notNull(),
  description: text("description"),
  // JSON Schema defining the form fields
  // Each field: { id, label, type, required, options?, conditionalOn? }
  // Field types: text, textarea, number, boolean, select, multi_select, date, signature, photo
  fields: jsonb("fields").notNull().default([]),
  // Which asset types this form is relevant for
  applicableAssetTypes: text("applicable_asset_types").array().default([]),
  // Whether this is a system-provided template (cannot be deleted, only archived)
  isSystemTemplate: boolean("is_system_template").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
  ...timestamps,
}, (t) => ({
  companyIdx: index("form_templates_company_idx").on(t.companyId),
  typeIdx: index("form_templates_type_idx").on(t.formType),
  activeIdx: index("form_templates_active_idx").on(t.isActive),
}));

// Form submissions — one per job+form combination, filled out by technician
export const formSubmissions = pgTable("form_submissions", {
  id: id(),
  companyId: companyId(),
  formTemplateId: uuid("form_template_id").notNull().references(() => formTemplates.id),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  assetId: uuid("asset_id").references(() => assets.id), // form may target a specific asset
  submittedById: uuid("submitted_by_id").references(() => users.id), // technician
  // Responses as key-value: { [fieldId]: value }
  responses: jsonb("responses").notNull().default({}),
  // Computed pass/fail for checklist-type forms (v1.5 feature, column present now)
  passedInspection: boolean("passed_inspection"),
  failureNotes: text("failure_notes"),
  // Submission state
  startedAt: timestamp("started_at"),
  submittedAt: timestamp("submitted_at"),
  ...timestamps,
}, (t) => ({
  companyIdx: index("form_submissions_company_idx").on(t.companyId),
  jobIdx: index("form_submissions_job_idx").on(t.jobId),
  templateIdx: index("form_submissions_template_idx").on(t.formTemplateId),
}));

// ─────────────────────────────────────────────
// 13. ONBOARDING / IMPORT
// ─────────────────────────────────────────────

// Tracks a single CSV import session from upload through completion
// Supports rollback: all records created by an import are tagged with import_session_id
export const importSessions = pgTable("import_sessions", {
  id: id(),
  companyId: companyId(),
  createdById: uuid("created_by_id").references(() => users.id),
  entityType: importEntityTypeEnum("entity_type").notNull(), // what is being imported
  status: importSessionStatusEnum("status").notNull().default("uploaded"),
  // Source file
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(), // S3/storage URL of the uploaded CSV
  // Row counts
  totalRows: integer("total_rows").default(0),
  validRows: integer("valid_rows").default(0),
  errorRows: integer("error_rows").default(0),
  importedRows: integer("imported_rows").default(0),
  skippedRows: integer("skipped_rows").default(0),
  duplicateRows: integer("duplicate_rows").default(0),
  // AI column mapping: { [csvColumnName]: schemaFieldName }
  // AI generates this; user reviews and confirms before import runs
  columnMappings: jsonb("column_mappings").default({}),
  // Validation errors per row: [{ row: 12, field: "phone", message: "Invalid format" }]
  validationErrors: jsonb("validation_errors").default([]),
  // AI-inferred values (e.g. asset types inferred from job description text)
  aiInferences: jsonb("ai_inferences").default({}),
  // Rollback
  rolledBackAt: timestamp("rolled_back_at"),
  rolledBackById: uuid("rolled_back_by_id").references(() => users.id),
  // Completion
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  ...timestamps,
}, (t) => ({
  companyIdx: index("import_sessions_company_idx").on(t.companyId),
  statusIdx: index("import_sessions_status_idx").on(t.status),
  entityTypeIdx: index("import_sessions_entity_type_idx").on(t.entityType),
}));

// ─────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  customers: many(customers),
  technicians: many(technicians),
  jobs: many(jobs),
  serviceAreas: many(serviceAreas),
  serviceAgreementTemplates: many(serviceAgreementTemplates),
  formTemplates: many(formTemplates),
  importSessions: many(importSessions),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  company: one(companies, { fields: [customers.companyId], references: [companies.id] }),
  properties: many(properties),
  assets: many(assets),
  jobs: many(jobs),
  estimates: many(estimates),
  invoices: many(invoices),
  payments: many(payments),
  maintenancePlans: many(maintenancePlans),
  aiRecommendations: many(aiRecommendations),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  company: one(companies, { fields: [properties.companyId], references: [companies.id] }),
  customer: one(customers, { fields: [properties.customerId], references: [customers.id] }),
  assets: many(assets),
  jobs: many(jobs),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  company: one(companies, { fields: [assets.companyId], references: [companies.id] }),
  property: one(properties, { fields: [assets.propertyId], references: [properties.id] }),
  customer: one(customers, { fields: [assets.customerId], references: [customers.id] }),
  jobs: many(jobs),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  company: one(companies, { fields: [jobs.companyId], references: [companies.id] }),
  customer: one(customers, { fields: [jobs.customerId], references: [customers.id] }),
  property: one(properties, { fields: [jobs.propertyId], references: [properties.id] }),
  asset: one(assets, { fields: [jobs.assetId], references: [assets.id] }),
  technician: one(technicians, { fields: [jobs.technicianId], references: [technicians.id] }),
  notes: many(jobNotes),
  photos: many(jobPhotos),
  estimates: many(estimates),
  invoices: many(invoices),
  scheduleSlots: many(scheduleSlots),
  activityEvents: many(activityEvents),
  formSubmissions: many(formSubmissions),
}));

export const techniciansRelations = relations(technicians, ({ one, many }) => ({
  company: one(companies, { fields: [technicians.companyId], references: [companies.id] }),
  user: one(users, { fields: [technicians.userId], references: [users.id] }),
  jobs: many(jobs),
  scheduleSlots: many(scheduleSlots),
}));

export const estimatesRelations = relations(estimates, ({ one, many }) => ({
  company: one(companies, { fields: [estimates.companyId], references: [companies.id] }),
  customer: one(customers, { fields: [estimates.customerId], references: [customers.id] }),
  job: one(jobs, { fields: [estimates.jobId], references: [jobs.id] }),
  items: many(estimateItems),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  company: one(companies, { fields: [invoices.companyId], references: [companies.id] }),
  customer: one(customers, { fields: [invoices.customerId], references: [customers.id] }),
  job: one(jobs, { fields: [invoices.jobId], references: [jobs.id] }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const maintenancePlansRelations = relations(maintenancePlans, ({ one, many }) => ({
  company: one(companies, { fields: [maintenancePlans.companyId], references: [companies.id] }),
  customer: one(customers, { fields: [maintenancePlans.customerId], references: [customers.id] }),
  template: one(serviceAgreementTemplates, {
    fields: [maintenancePlans.serviceAgreementTemplateId],
    references: [serviceAgreementTemplates.id],
  }),
  visits: many(maintenanceVisits),
}));

export const serviceAgreementTemplatesRelations = relations(serviceAgreementTemplates, ({ one, many }) => ({
  company: one(companies, { fields: [serviceAgreementTemplates.companyId], references: [companies.id] }),
  plans: many(maintenancePlans),
}));

export const aiRecommendationsRelations = relations(aiRecommendations, ({ one }) => ({
  company: one(companies, { fields: [aiRecommendations.companyId], references: [companies.id] }),
  customer: one(customers, { fields: [aiRecommendations.customerId], references: [customers.id] }),
  asset: one(assets, { fields: [aiRecommendations.assetId], references: [assets.id] }),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  company: one(companies, { fields: [campaigns.companyId], references: [companies.id] }),
  recipients: many(campaignRecipients),
}));

export const formTemplatesRelations = relations(formTemplates, ({ one, many }) => ({
  company: one(companies, { fields: [formTemplates.companyId], references: [companies.id] }),
  submissions: many(formSubmissions),
}));

export const formSubmissionsRelations = relations(formSubmissions, ({ one }) => ({
  company: one(companies, { fields: [formSubmissions.companyId], references: [companies.id] }),
  formTemplate: one(formTemplates, {
    fields: [formSubmissions.formTemplateId],
    references: [formTemplates.id],
  }),
  job: one(jobs, { fields: [formSubmissions.jobId], references: [jobs.id] }),
  asset: one(assets, { fields: [formSubmissions.assetId], references: [assets.id] }),
}));

export const importSessionsRelations = relations(importSessions, ({ one }) => ({
  company: one(companies, { fields: [importSessions.companyId], references: [companies.id] }),
  createdBy: one(users, { fields: [importSessions.createdById], references: [users.id] }),
}));
