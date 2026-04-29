import { randomUUID } from "node:crypto";
import { Decimal } from "decimal.js";

type Predicate<T> = (row: T) => boolean;

type TableName =
  | "companies"
  | "users"
  | "refreshTokens"
  | "customers"
  | "properties"
  | "assets"
  | "jobs"
  | "importSessions"
  | "estimates"
  | "estimateItems"
  | "invoices"
  | "invoiceItems"
  | "payments"
  | "jobNotes"
  | "jobPhotos"
  | "serviceAgreementTemplates"
  | "maintenancePlans"
  | "maintenanceVisits"
  | "automationRules"
  | "aiRecommendations"
  | "campaigns"
  | "campaignRecipients"
  | "messageLogs"
  | "productCatalog"
  | "technicians"
  | "jobTasks"
  | "jobProducts"
  | "scheduleSlots"
  | "activityEvents";

type UserRole = "owner" | "admin" | "dispatcher" | "office" | "technician";
type TechnicianStatus = "active" | "inactive" | "on_leave";
type JobStatus =
  | "lead"
  | "estimate_requested"
  | "estimate_sent"
  | "estimate_approved"
  | "scheduled"
  | "dispatched"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "invoiced"
  | "paid"
  | "cancelled"
  | "closed";
type JobType =
  | "service_call"
  | "maintenance"
  | "installation"
  | "inspection"
  | "estimate_only"
  | "warranty"
  | "callback"
  | "emergency";
type JobPriority = "low" | "normal" | "high" | "urgent";
type JobPhotoType = "before" | "after" | "general";
type EstimateStatus = "draft" | "sent" | "viewed" | "approved" | "declined" | "expired" | "converted" | "revised";
type EstimateItemType = "service" | "labor" | "material" | "fee";
type InvoiceStatus = "draft" | "sent" | "viewed" | "partially_paid" | "paid" | "overdue" | "void" | "written_off";
type InvoiceItemType = "service" | "labor" | "material" | "fee";
type PaymentMethod = "card" | "ach" | "cash" | "check" | "financing" | "other";
type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded" | "disputed";
type MaintenancePlanStatus = "active" | "paused" | "expired" | "cancelled";
type MaintenancePlanFrequency = "monthly" | "bi_monthly" | "quarterly" | "bi_annual" | "annual";
type ServiceAgreementBillingCycle = "monthly" | "annual";
type ImportSessionStatus = "uploaded" | "mapping" | "preview" | "importing" | "completed" | "failed" | "rolled_back";
type ImportEntityType = "customers" | "properties" | "assets" | "jobs" | "estimates" | "invoices";
type AutomationRuleType =
  | "estimate_follow_up"
  | "estimate_declined"
  | "invoice_reminder"
  | "invoice_overdue"
  | "dormant_customer"
  | "maintenance_due"
  | "service_agreement_renewal"
  | "job_follow_up";
type AiRecommendationType =
  | "reactivation"
  | "aging_asset"
  | "maintenance_due"
  | "unsold_estimate"
  | "unpaid_invoice"
  | "upsell_opportunity"
  | "seasonal_campaign"
  | "maintenance_plan_offer";
type AiRecommendationStatus = "pending" | "actioned" | "dismissed" | "snoozed" | "expired";
type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "cancelled";
type CampaignType =
  | "reactivation"
  | "estimate_follow_up"
  | "invoice_reminder"
  | "seasonal"
  | "maintenance_reminder"
  | "custom";
type MessageChannel = "sms" | "email";
type MessageDirection = "inbound" | "outbound";
type ProductCategory = "service" | "labor" | "material" | "equipment" | "fee" | "bundle";
type JobTaskStatus = "pending" | "in_progress" | "completed" | "skipped";

export interface TestCompanyRecord {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;
  timezone: string;
  stripeCustomerId: string | null;
  stripeAccountId: string | null;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TestUserRecord {
  id: string;
  companyId: string;
  email: string;
  passwordHash: string | null;
  passwordChangedAt: Date | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  technicianId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TestRefreshTokenRecord {
  id: string;
  companyId: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface TestCustomerRecord {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  altPhone: string | null;
  leadSource: string | null;
  referredBy: string | null;
  tags: string[] | null;
  internalNotes: string | null;
  lifetimeValue: string | null;
  totalJobs: number | null;
  lastServiceDate: string | null;
  firstServiceDate: string | null;
  prefersSms: boolean | null;
  prefersEmail: boolean | null;
  doNotContact: boolean | null;
  stripeCustomerId: string | null;
  importSessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TestPropertyRecord {
  id: string;
  companyId: string;
  customerId: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string | null;
  lat: string | null;
  lng: string | null;
  type: "residential" | "commercial" | "industrial" | "multi_family";
  sqft: number | null;
  yearBuilt: number | null;
  accessNotes: string | null;
  notes: string | null;
  isPrimary: boolean;
  isActive: boolean;
  importSessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TestAssetRecord {
  id: string;
  companyId: string;
  propertyId: string;
  customerId: string;
  name: string;
  assetType: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  installDate: string | null;
  warrantyExpiration: string | null;
  lastServiceDate: string | null;
  nextServiceDate: string | null;
  condition: "excellent" | "good" | "fair" | "poor" | "failed" | null;
  conditionNotes: string | null;
  conditionScore: number | null;
  replacementProbability: string | null;
  photoUrls: string[] | null;
  notes: string | null;
  isActive: boolean;
  importSessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TestJobRecord {
  id: string;
  companyId: string;
  customerId: string;
  jobNumber: string;
  propertyId: string | null;
  assetId: string | null;
  technicianId: string | null;
  assignedById: string | null;
  type: JobType;
  priority: JobPriority;
  status: JobStatus;
  leadSource: string | null;
  title: string;
  description: string | null;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  scheduledDurationMinutes: number | null;
  actualStart: Date | null;
  actualEnd: Date | null;
  techNotes: string | null;
  completionNotes: string | null;
  signatureUrl: string | null;
  signedAt: Date | null;
  signedByName: string | null;
  estimateTotal: string | null;
  invoiceTotal: string | null;
  amountPaid: string | null;
  maintenancePlanId: string | null;
  parentJobId: string | null;
  tags: string[] | null;
  importSessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TestImportValidationError {
  row: number;
  field: string;
  message: string;
  value: string;
}

export interface TestImportSessionRecord {
  id: string;
  companyId: string;
  createdById: string | null;
  entityType: ImportEntityType;
  status: ImportSessionStatus;
  fileName: string;
  fileUrl: string;
  totalRows: number | null;
  validRows: number | null;
  errorRows: number | null;
  importedRows: number | null;
  skippedRows: number | null;
  duplicateRows: number | null;
  columnMappings: Record<string, string | null>;
  validationErrors: TestImportValidationError[];
  aiInferences: Record<string, unknown>;
  rolledBackAt: Date | null;
  rolledBackById: string | null;
  completedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TestEstimateRecord {
  id: string;
  companyId: string;
  estimateNumber: string;
  jobId: string | null;
  customerId: string;
  propertyId: string | null;
  createdById: string | null;
  status: EstimateStatus;
  tierLabel: string | null;
  tierGroupId: string | null;
  isSelectedTier: boolean | null;
  subtotal: string;
  taxRate: string | null;
  taxAmount: string | null;
  discountAmount: string | null;
  total: string;
  title: string | null;
  messageToCustomer: string | null;
  internalNotes: string | null;
  approvalToken: string | null;
  approvedAt: Date | null;
  approvedByName: string | null;
  approvedSignatureUrl: string | null;
  declinedAt: Date | null;
  declineReason: string | null;
  expiresAt: Date | null;
  sentAt: Date | null;
  viewedAt: Date | null;
  followUpSentAt: Date | null;
  financingOffered: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TestEstimateItemRecord {
  id: string;
  estimateId: string;
  companyId: string;
  name: string;
  description: string | null;
  itemType: EstimateItemType;
  quantity: string;
  unitPrice: string;
  total: string;
  isTaxable: boolean | null;
  sortOrder: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TestInvoiceRecord {
  id: string;
  companyId: string;
  invoiceNumber: string;
  jobId: string | null;
  estimateId: string | null;
  customerId: string;
  createdById: string | null;
  status: InvoiceStatus;
  subtotal: string;
  taxRate: string | null;
  taxAmount: string | null;
  discountAmount: string | null;
  total: string;
  amountPaid: string | null;
  balanceDue: string;
  issuedAt: Date | null;
  dueAt: Date | null;
  sentAt: Date | null;
  viewedAt: Date | null;
  paidAt: Date | null;
  stripePaymentLinkId: string | null;
  stripePaymentLinkUrl: string | null;
  paymentToken: string | null;
  reminder1SentAt: Date | null;
  reminder2SentAt: Date | null;
  reminder3SentAt: Date | null;
  title: string | null;
  messageToCustomer: string | null;
  internalNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TestInvoiceItemRecord {
  id: string;
  invoiceId: string;
  companyId: string;
  name: string;
  description: string | null;
  itemType: InvoiceItemType;
  quantity: string;
  unitPrice: string;
  total: string;
  isTaxable: boolean | null;
  sortOrder: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TestPaymentRecord {
  id: string;
  companyId: string;
  invoiceId: string;
  customerId: string;
  collectedById: string | null;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  stripePaymentIntentId: string | null;
  stripeChargeId: string | null;
  checkNumber: string | null;
  referenceNumber: string | null;
  notes: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TestJobNoteRecord {
  id: string;
  companyId: string;
  jobId: string;
  authorId: string | null;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TestJobPhotoRecord {
  id: string;
  companyId: string;
  jobId: string;
  uploadedById: string | null;
  url: string;
  thumbnailUrl: string | null;
  caption: string | null;
  takenAt: Date | null;
  photoType: JobPhotoType | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TestServiceAgreementTemplateRecord {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  includedServices: string[] | null;
  visitsPerYear: number;
  frequency: MaintenancePlanFrequency;
  monthlyPrice: string | null;
  annualPrice: string | null;
  stripeMthlyPriceId: string | null;
  stripeAnnualPriceId: string | null;
  sortOrder: number | null;
  isActive: boolean;
  applicableAssetTypes: string[] | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TestMaintenancePlanRecord {
  id: string;
  companyId: string;
  customerId: string;
  propertyId: string | null;
  serviceAgreementTemplateId: string | null;
  name: string;
  description: string | null;
  includedServices: string[] | null;
  assetIds: string[] | null;
  status: MaintenancePlanStatus;
  frequency: MaintenancePlanFrequency;
  price: string | null;
  billingCycle: ServiceAgreementBillingCycle | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeCurrentPeriodStart: Date | null;
  stripeCurrentPeriodEnd: Date | null;
  stripeCancelAtPeriodEnd: boolean | null;
  startDate: string;
  endDate: string | null;
  nextServiceDate: string | null;
  lastServiceDate: string | null;
  notes: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestMaintenanceVisitRecord {
  id: string;
  companyId: string;
  maintenancePlanId: string;
  jobId: string | null;
  scheduledDate: string | null;
  completedDate: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TestAutomationRuleRecord {
  id: string;
  companyId: string;
  ruleType: AutomationRuleType;
  isEnabled: boolean;
  delayHours: number | null;
  thresholdDays: number | null;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TestAiRecommendationRecord {
  id: string;
  companyId: string;
  type: AiRecommendationType;
  status: AiRecommendationStatus;
  customerId: string | null;
  propertyId: string | null;
  assetId: string | null;
  jobId: string | null;
  estimateId: string | null;
  invoiceId: string | null;
  estimatedRevenue: string | null;
  headline: string;
  body: string;
  suggestedAction: string | null;
  suggestedMessage: string | null;
  urgencyScore: number | null;
  confidenceScore: number | null;
  actionedAt: Date | null;
  actionedById: string | null;
  dismissedAt: Date | null;
  snoozedUntil: Date | null;
  expiresAt: Date | null;
  sourceEventIds: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TestCampaignRecord {
  id: string;
  companyId: string;
  createdById: string | null;
  type: CampaignType;
  status: CampaignStatus;
  name: string;
  subject: string | null;
  body: string;
  channel: MessageChannel;
  isAiGenerated: boolean | null;
  aiRecommendationId: string | null;
  scheduledAt: Date | null;
  sentAt: Date | null;
  recipientCount: number | null;
  deliveredCount: number | null;
  openedCount: number | null;
  repliedCount: number | null;
  convertedCount: number | null;
  revenueAttributed: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TestCampaignRecipientRecord {
  id: string;
  campaignId: string;
  customerId: string;
  companyId: string;
  sentAt: Date | null;
  deliveredAt: Date | null;
  openedAt: Date | null;
  repliedAt: Date | null;
  convertedAt: Date | null;
  conversionJobId: string | null;
  sentToPhone: string | null;
  sentToEmail: string | null;
  unsubscribedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TestMessageLogRecord {
  id: string;
  companyId: string;
  customerId: string | null;
  jobId: string | null;
  campaignId: string | null;
  channel: MessageChannel;
  direction: MessageDirection;
  toAddress: string;
  fromAddress: string | null;
  subject: string | null;
  body: string;
  providerMessageId: string | null;
  providerStatus: string | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TestProductCatalogRecord {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  category: ProductCategory;
  sku: string | null;
  unitPrice: string;
  cost: string | null;
  unit: string | null;
  isTaxable: boolean | null;
  isActive: boolean;
  applicableAssetTypes: string[] | null;
  sortOrder: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TestTechnicianRecord {
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

export interface TestJobTaskRecord {
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

export interface TestJobProductRecord {
  id: string;
  companyId: string;
  jobId: string;
  productCatalogId: string | null;
  name: string;
  description: string | null;
  category: ProductCategory;
  quantity: string;
  unitPrice: string;
  total: string;
  isTaxable: boolean | null;
  addedById: string | null;
  isUpsell: boolean | null;
  upsellApproved: boolean | null;
  upsellApprovedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TestScheduleSlotRecord {
  id: string;
  companyId: string;
  technicianId: string;
  jobId: string | null;
  isBlockedTime: boolean | null;
  blockReason: string | null;
  startTime: Date;
  endTime: Date;
  travelMinutesBefore: number | null;
  isConfirmed: boolean | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TestActivityEventRecord {
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
  occurredAt: Date;
}

type AnyTestRecord =
  | TestCompanyRecord
  | TestUserRecord
  | TestRefreshTokenRecord
  | TestCustomerRecord
  | TestPropertyRecord
  | TestAssetRecord
  | TestJobRecord
  | TestImportSessionRecord
  | TestEstimateRecord
  | TestEstimateItemRecord
  | TestInvoiceRecord
  | TestInvoiceItemRecord
  | TestPaymentRecord
  | TestJobNoteRecord
  | TestJobPhotoRecord
  | TestServiceAgreementTemplateRecord
  | TestMaintenancePlanRecord
  | TestMaintenanceVisitRecord
  | TestAutomationRuleRecord
  | TestAiRecommendationRecord
  | TestCampaignRecord
  | TestCampaignRecipientRecord
  | TestMessageLogRecord
  | TestProductCatalogRecord
  | TestTechnicianRecord
  | TestJobTaskRecord
  | TestJobProductRecord
  | TestScheduleSlotRecord
  | TestActivityEventRecord;

type MockTable =
  | typeof companiesTable
  | typeof usersTable
  | typeof refreshTokensTable
  | typeof customersTable
  | typeof propertiesTable
  | typeof assetsTable
  | typeof jobsTable
  | typeof importSessionsTable
  | typeof estimatesTable
  | typeof estimateItemsTable
  | typeof invoicesTable
  | typeof invoiceItemsTable
  | typeof paymentsTable
  | typeof jobNotesTable
  | typeof jobPhotosTable
  | typeof serviceAgreementTemplatesTable
  | typeof maintenancePlansTable
  | typeof maintenanceVisitsTable
  | typeof automationRulesTable
  | typeof aiRecommendationsTable
  | typeof campaignsTable
  | typeof campaignRecipientsTable
  | typeof messageLogsTable
  | typeof productCatalogTable
  | typeof techniciansTable
  | typeof jobTasksTable
  | typeof jobProductsTable
  | typeof scheduleSlotsTable
  | typeof activityEventsTable;

interface TestState {
  companies: TestCompanyRecord[];
  users: TestUserRecord[];
  refreshTokens: TestRefreshTokenRecord[];
  customers: TestCustomerRecord[];
  properties: TestPropertyRecord[];
  assets: TestAssetRecord[];
  jobs: TestJobRecord[];
  importSessions: TestImportSessionRecord[];
  estimates: TestEstimateRecord[];
  estimateItems: TestEstimateItemRecord[];
  invoices: TestInvoiceRecord[];
  invoiceItems: TestInvoiceItemRecord[];
  payments: TestPaymentRecord[];
  jobNotes: TestJobNoteRecord[];
  jobPhotos: TestJobPhotoRecord[];
  serviceAgreementTemplates: TestServiceAgreementTemplateRecord[];
  maintenancePlans: TestMaintenancePlanRecord[];
  maintenanceVisits: TestMaintenanceVisitRecord[];
  automationRules: TestAutomationRuleRecord[];
  aiRecommendations: TestAiRecommendationRecord[];
  campaigns: TestCampaignRecord[];
  campaignRecipients: TestCampaignRecipientRecord[];
  messageLogs: TestMessageLogRecord[];
  productCatalog: TestProductCatalogRecord[];
  technicians: TestTechnicianRecord[];
  jobTasks: TestJobTaskRecord[];
  jobProducts: TestJobProductRecord[];
  scheduleSlots: TestScheduleSlotRecord[];
  activityEvents: TestActivityEventRecord[];
}

interface OrderByDefinition {
  direction: "asc" | "desc";
  field: string;
}

const companiesTable = {
  __name: "companies",
  id: "id",
  name: "name",
  slug: "slug",
  phone: "phone",
  email: "email",
  website: "website",
  logoUrl: "logoUrl",
  addressLine1: "addressLine1",
  addressLine2: "addressLine2",
  city: "city",
  state: "state",
  zip: "zip",
  country: "country",
  timezone: "timezone",
  stripeCustomerId: "stripeCustomerId",
  stripeAccountId: "stripeAccountId",
  settings: "settings",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const usersTable = {
  __name: "users",
  id: "id",
  companyId: "companyId",
  email: "email",
  passwordHash: "passwordHash",
  passwordChangedAt: "passwordChangedAt",
  firstName: "firstName",
  lastName: "lastName",
  phone: "phone",
  role: "role",
  avatarUrl: "avatarUrl",
  isActive: "isActive",
  lastLoginAt: "lastLoginAt",
  technicianId: "technicianId",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const refreshTokensTable = {
  __name: "refreshTokens",
  id: "id",
  companyId: "companyId",
  userId: "userId",
  tokenHash: "tokenHash",
  expiresAt: "expiresAt",
  revokedAt: "revokedAt",
  createdAt: "createdAt"
} as const;

const customersTable = {
  __name: "customers",
  id: "id",
  companyId: "companyId",
  firstName: "firstName",
  lastName: "lastName",
  displayName: "displayName",
  email: "email",
  phone: "phone",
  altPhone: "altPhone",
  leadSource: "leadSource",
  referredBy: "referredBy",
  tags: "tags",
  internalNotes: "internalNotes",
  lifetimeValue: "lifetimeValue",
  totalJobs: "totalJobs",
  lastServiceDate: "lastServiceDate",
  firstServiceDate: "firstServiceDate",
  prefersSms: "prefersSms",
  prefersEmail: "prefersEmail",
  doNotContact: "doNotContact",
  stripeCustomerId: "stripeCustomerId",
  importSessionId: "importSessionId",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const propertiesTable = {
  __name: "properties",
  id: "id",
  companyId: "companyId",
  customerId: "customerId",
  addressLine1: "addressLine1",
  addressLine2: "addressLine2",
  city: "city",
  state: "state",
  zip: "zip",
  country: "country",
  lat: "lat",
  lng: "lng",
  type: "type",
  sqft: "sqft",
  yearBuilt: "yearBuilt",
  accessNotes: "accessNotes",
  notes: "notes",
  isPrimary: "isPrimary",
  isActive: "isActive",
  importSessionId: "importSessionId",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const assetsTable = {
  __name: "assets",
  id: "id",
  companyId: "companyId",
  propertyId: "propertyId",
  customerId: "customerId",
  name: "name",
  assetType: "assetType",
  brand: "brand",
  model: "model",
  serialNumber: "serialNumber",
  installDate: "installDate",
  warrantyExpiration: "warrantyExpiration",
  lastServiceDate: "lastServiceDate",
  nextServiceDate: "nextServiceDate",
  condition: "condition",
  conditionNotes: "conditionNotes",
  conditionScore: "conditionScore",
  replacementProbability: "replacementProbability",
  photoUrls: "photoUrls",
  notes: "notes",
  isActive: "isActive",
  importSessionId: "importSessionId",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const jobsTable = {
  __name: "jobs",
  id: "id",
  companyId: "companyId",
  customerId: "customerId",
  jobNumber: "jobNumber",
  propertyId: "propertyId",
  assetId: "assetId",
  technicianId: "technicianId",
  assignedById: "assignedById",
  type: "type",
  priority: "priority",
  status: "status",
  leadSource: "leadSource",
  title: "title",
  description: "description",
  scheduledStart: "scheduledStart",
  scheduledEnd: "scheduledEnd",
  scheduledDurationMinutes: "scheduledDurationMinutes",
  actualStart: "actualStart",
  actualEnd: "actualEnd",
  techNotes: "techNotes",
  completionNotes: "completionNotes",
  signatureUrl: "signatureUrl",
  signedAt: "signedAt",
  signedByName: "signedByName",
  estimateTotal: "estimateTotal",
  invoiceTotal: "invoiceTotal",
  amountPaid: "amountPaid",
  maintenancePlanId: "maintenancePlanId",
  parentJobId: "parentJobId",
  tags: "tags",
  importSessionId: "importSessionId",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const importSessionsTable = {
  __name: "importSessions",
  id: "id",
  companyId: "companyId",
  createdById: "createdById",
  entityType: "entityType",
  status: "status",
  fileName: "fileName",
  fileUrl: "fileUrl",
  totalRows: "totalRows",
  validRows: "validRows",
  errorRows: "errorRows",
  importedRows: "importedRows",
  skippedRows: "skippedRows",
  duplicateRows: "duplicateRows",
  columnMappings: "columnMappings",
  validationErrors: "validationErrors",
  aiInferences: "aiInferences",
  rolledBackAt: "rolledBackAt",
  rolledBackById: "rolledBackById",
  completedAt: "completedAt",
  errorMessage: "errorMessage",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const estimatesTable = {
  __name: "estimates",
  id: "id",
  companyId: "companyId",
  estimateNumber: "estimateNumber",
  jobId: "jobId",
  customerId: "customerId",
  propertyId: "propertyId",
  createdById: "createdById",
  status: "status",
  tierLabel: "tierLabel",
  tierGroupId: "tierGroupId",
  isSelectedTier: "isSelectedTier",
  subtotal: "subtotal",
  taxRate: "taxRate",
  taxAmount: "taxAmount",
  discountAmount: "discountAmount",
  total: "total",
  title: "title",
  messageToCustomer: "messageToCustomer",
  internalNotes: "internalNotes",
  approvalToken: "approvalToken",
  approvedAt: "approvedAt",
  approvedByName: "approvedByName",
  approvedSignatureUrl: "approvedSignatureUrl",
  declinedAt: "declinedAt",
  declineReason: "declineReason",
  expiresAt: "expiresAt",
  sentAt: "sentAt",
  viewedAt: "viewedAt",
  followUpSentAt: "followUpSentAt",
  financingOffered: "financingOffered",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const estimateItemsTable = {
  __name: "estimateItems",
  id: "id",
  estimateId: "estimateId",
  companyId: "companyId",
  name: "name",
  description: "description",
  itemType: "itemType",
  quantity: "quantity",
  unitPrice: "unitPrice",
  total: "total",
  isTaxable: "isTaxable",
  sortOrder: "sortOrder",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const invoicesTable = {
  __name: "invoices",
  id: "id",
  companyId: "companyId",
  invoiceNumber: "invoiceNumber",
  jobId: "jobId",
  estimateId: "estimateId",
  customerId: "customerId",
  createdById: "createdById",
  status: "status",
  subtotal: "subtotal",
  taxRate: "taxRate",
  taxAmount: "taxAmount",
  discountAmount: "discountAmount",
  total: "total",
  amountPaid: "amountPaid",
  balanceDue: "balanceDue",
  issuedAt: "issuedAt",
  dueAt: "dueAt",
  sentAt: "sentAt",
  viewedAt: "viewedAt",
  paidAt: "paidAt",
  stripePaymentLinkId: "stripePaymentLinkId",
  stripePaymentLinkUrl: "stripePaymentLinkUrl",
  paymentToken: "paymentToken",
  reminder1SentAt: "reminder1SentAt",
  reminder2SentAt: "reminder2SentAt",
  reminder3SentAt: "reminder3SentAt",
  title: "title",
  messageToCustomer: "messageToCustomer",
  internalNotes: "internalNotes",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const invoiceItemsTable = {
  __name: "invoiceItems",
  id: "id",
  invoiceId: "invoiceId",
  companyId: "companyId",
  name: "name",
  description: "description",
  itemType: "itemType",
  quantity: "quantity",
  unitPrice: "unitPrice",
  total: "total",
  isTaxable: "isTaxable",
  sortOrder: "sortOrder",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const paymentsTable = {
  __name: "payments",
  id: "id",
  companyId: "companyId",
  invoiceId: "invoiceId",
  customerId: "customerId",
  collectedById: "collectedById",
  amount: "amount",
  method: "method",
  status: "status",
  stripePaymentIntentId: "stripePaymentIntentId",
  stripeChargeId: "stripeChargeId",
  checkNumber: "checkNumber",
  referenceNumber: "referenceNumber",
  notes: "notes",
  paidAt: "paidAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const jobNotesTable = {
  __name: "jobNotes",
  id: "id",
  companyId: "companyId",
  jobId: "jobId",
  authorId: "authorId",
  content: "content",
  isInternal: "isInternal",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const jobPhotosTable = {
  __name: "jobPhotos",
  id: "id",
  companyId: "companyId",
  jobId: "jobId",
  uploadedById: "uploadedById",
  url: "url",
  thumbnailUrl: "thumbnailUrl",
  caption: "caption",
  takenAt: "takenAt",
  photoType: "photoType",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const serviceAgreementTemplatesTable = {
  __name: "serviceAgreementTemplates",
  id: "id",
  companyId: "companyId",
  name: "name",
  description: "description",
  includedServices: "includedServices",
  visitsPerYear: "visitsPerYear",
  frequency: "frequency",
  monthlyPrice: "monthlyPrice",
  annualPrice: "annualPrice",
  stripeMthlyPriceId: "stripeMthlyPriceId",
  stripeAnnualPriceId: "stripeAnnualPriceId",
  sortOrder: "sortOrder",
  isActive: "isActive",
  applicableAssetTypes: "applicableAssetTypes",
  notes: "notes",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const maintenancePlansTable = {
  __name: "maintenancePlans",
  id: "id",
  companyId: "companyId",
  customerId: "customerId",
  propertyId: "propertyId",
  serviceAgreementTemplateId: "serviceAgreementTemplateId",
  name: "name",
  description: "description",
  includedServices: "includedServices",
  assetIds: "assetIds",
  status: "status",
  frequency: "frequency",
  price: "price",
  billingCycle: "billingCycle",
  stripeSubscriptionId: "stripeSubscriptionId",
  stripePriceId: "stripePriceId",
  stripeCurrentPeriodStart: "stripeCurrentPeriodStart",
  stripeCurrentPeriodEnd: "stripeCurrentPeriodEnd",
  stripeCancelAtPeriodEnd: "stripeCancelAtPeriodEnd",
  startDate: "startDate",
  endDate: "endDate",
  nextServiceDate: "nextServiceDate",
  lastServiceDate: "lastServiceDate",
  notes: "notes",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
} as const;

const maintenanceVisitsTable = {
  __name: "maintenanceVisits",
  id: "id",
  companyId: "companyId",
  maintenancePlanId: "maintenancePlanId",
  jobId: "jobId",
  scheduledDate: "scheduledDate",
  completedDate: "completedDate",
  notes: "notes",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const automationRulesTable = {
  __name: "automationRules",
  id: "id",
  companyId: "companyId",
  ruleType: "ruleType",
  isEnabled: "isEnabled",
  delayHours: "delayHours",
  thresholdDays: "thresholdDays",
  config: "config",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const aiRecommendationsTable = {
  __name: "aiRecommendations",
  id: "id",
  companyId: "companyId",
  type: "type",
  status: "status",
  customerId: "customerId",
  propertyId: "propertyId",
  assetId: "assetId",
  jobId: "jobId",
  estimateId: "estimateId",
  invoiceId: "invoiceId",
  estimatedRevenue: "estimatedRevenue",
  headline: "headline",
  body: "body",
  suggestedAction: "suggestedAction",
  suggestedMessage: "suggestedMessage",
  urgencyScore: "urgencyScore",
  confidenceScore: "confidenceScore",
  actionedAt: "actionedAt",
  actionedById: "actionedById",
  dismissedAt: "dismissedAt",
  snoozedUntil: "snoozedUntil",
  expiresAt: "expiresAt",
  sourceEventIds: "sourceEventIds",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const campaignsTable = {
  __name: "campaigns",
  id: "id",
  companyId: "companyId",
  createdById: "createdById",
  type: "type",
  status: "status",
  name: "name",
  subject: "subject",
  body: "body",
  channel: "channel",
  isAiGenerated: "isAiGenerated",
  aiRecommendationId: "aiRecommendationId",
  scheduledAt: "scheduledAt",
  sentAt: "sentAt",
  recipientCount: "recipientCount",
  deliveredCount: "deliveredCount",
  openedCount: "openedCount",
  repliedCount: "repliedCount",
  convertedCount: "convertedCount",
  revenueAttributed: "revenueAttributed",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const campaignRecipientsTable = {
  __name: "campaignRecipients",
  id: "id",
  campaignId: "campaignId",
  customerId: "customerId",
  companyId: "companyId",
  sentAt: "sentAt",
  deliveredAt: "deliveredAt",
  openedAt: "openedAt",
  repliedAt: "repliedAt",
  convertedAt: "convertedAt",
  conversionJobId: "conversionJobId",
  sentToPhone: "sentToPhone",
  sentToEmail: "sentToEmail",
  unsubscribedAt: "unsubscribedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const messageLogsTable = {
  __name: "messageLogs",
  id: "id",
  companyId: "companyId",
  customerId: "customerId",
  jobId: "jobId",
  campaignId: "campaignId",
  channel: "channel",
  direction: "direction",
  toAddress: "toAddress",
  fromAddress: "fromAddress",
  subject: "subject",
  body: "body",
  providerMessageId: "providerMessageId",
  providerStatus: "providerStatus",
  sentAt: "sentAt",
  deliveredAt: "deliveredAt",
  failedAt: "failedAt",
  failureReason: "failureReason",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const productCatalogTable = {
  __name: "productCatalog",
  id: "id",
  companyId: "companyId",
  name: "name",
  description: "description",
  category: "category",
  sku: "sku",
  unitPrice: "unitPrice",
  cost: "cost",
  unit: "unit",
  isTaxable: "isTaxable",
  isActive: "isActive",
  applicableAssetTypes: "applicableAssetTypes",
  sortOrder: "sortOrder",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const techniciansTable = {
  __name: "technicians",
  id: "id",
  companyId: "companyId",
  userId: "userId",
  firstName: "firstName",
  lastName: "lastName",
  email: "email",
  phone: "phone",
  avatarUrl: "avatarUrl",
  skills: "skills",
  serviceAreaIds: "serviceAreaIds",
  serviceZipCodes: "serviceZipCodes",
  hoursPerDay: "hoursPerDay",
  totalJobsCompleted: "totalJobsCompleted",
  avgJobDurationMinutes: "avgJobDurationMinutes",
  estimateCloseRate: "estimateCloseRate",
  avgTicketValue: "avgTicketValue",
  status: "status",
  calendarColor: "calendarColor",
  notes: "notes",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const jobTasksTable = {
  __name: "jobTasks",
  id: "id",
  companyId: "companyId",
  jobId: "jobId",
  assignedToId: "assignedToId",
  title: "title",
  description: "description",
  status: "status",
  isRequired: "isRequired",
  completedAt: "completedAt",
  completedById: "completedById",
  estimatedMinutes: "estimatedMinutes",
  actualMinutes: "actualMinutes",
  sortOrder: "sortOrder",
  notes: "notes",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const jobProductsTable = {
  __name: "jobProducts",
  id: "id",
  companyId: "companyId",
  jobId: "jobId",
  productCatalogId: "productCatalogId",
  name: "name",
  description: "description",
  category: "category",
  quantity: "quantity",
  unitPrice: "unitPrice",
  total: "total",
  isTaxable: "isTaxable",
  addedById: "addedById",
  isUpsell: "isUpsell",
  upsellApproved: "upsellApproved",
  upsellApprovedAt: "upsellApprovedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const scheduleSlotsTable = {
  __name: "scheduleSlots",
  id: "id",
  companyId: "companyId",
  technicianId: "technicianId",
  jobId: "jobId",
  isBlockedTime: "isBlockedTime",
  blockReason: "blockReason",
  startTime: "startTime",
  endTime: "endTime",
  travelMinutesBefore: "travelMinutesBefore",
  isConfirmed: "isConfirmed",
  notes: "notes",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  deletedAt: "deletedAt"
} as const;

const activityEventsTable = {
  __name: "activityEvents",
  id: "id",
  companyId: "companyId",
  eventType: "eventType",
  actorId: "actorId",
  actorType: "actorType",
  actorName: "actorName",
  entityType: "entityType",
  entityId: "entityId",
  customerId: "customerId",
  jobId: "jobId",
  estimateId: "estimateId",
  invoiceId: "invoiceId",
  payload: "payload",
  summary: "summary",
  occurredAt: "occurredAt"
} as const;

const state: TestState = {
  companies: [],
  users: [],
  refreshTokens: [],
  customers: [],
  properties: [],
  assets: [],
  jobs: [],
  importSessions: [],
  estimates: [],
  estimateItems: [],
  invoices: [],
  invoiceItems: [],
  payments: [],
  jobNotes: [],
  jobPhotos: [],
  serviceAgreementTemplates: [],
  maintenancePlans: [],
  maintenanceVisits: [],
  automationRules: [],
  aiRecommendations: [],
  campaigns: [],
  campaignRecipients: [],
  messageLogs: [],
  productCatalog: [],
  technicians: [],
  jobTasks: [],
  jobProducts: [],
  scheduleSlots: [],
  activityEvents: []
};

function nextId(): string {
  return randomUUID();
}

function cloneState(): TestState {
  return structuredClone(state);
}

function restoreState(snapshot: TestState): void {
  state.companies.splice(0, state.companies.length, ...snapshot.companies);
  state.users.splice(0, state.users.length, ...snapshot.users);
  state.refreshTokens.splice(0, state.refreshTokens.length, ...snapshot.refreshTokens);
  state.customers.splice(0, state.customers.length, ...snapshot.customers);
  state.properties.splice(0, state.properties.length, ...snapshot.properties);
  state.assets.splice(0, state.assets.length, ...snapshot.assets);
  state.jobs.splice(0, state.jobs.length, ...snapshot.jobs);
  state.importSessions.splice(0, state.importSessions.length, ...snapshot.importSessions);
  state.estimates.splice(0, state.estimates.length, ...snapshot.estimates);
  state.estimateItems.splice(0, state.estimateItems.length, ...snapshot.estimateItems);
  state.invoices.splice(0, state.invoices.length, ...snapshot.invoices);
  state.invoiceItems.splice(0, state.invoiceItems.length, ...snapshot.invoiceItems);
  state.payments.splice(0, state.payments.length, ...snapshot.payments);
  state.jobNotes.splice(0, state.jobNotes.length, ...snapshot.jobNotes);
  state.jobPhotos.splice(0, state.jobPhotos.length, ...snapshot.jobPhotos);
  state.serviceAgreementTemplates.splice(0, state.serviceAgreementTemplates.length, ...snapshot.serviceAgreementTemplates);
  state.maintenancePlans.splice(0, state.maintenancePlans.length, ...snapshot.maintenancePlans);
  state.maintenanceVisits.splice(0, state.maintenanceVisits.length, ...snapshot.maintenanceVisits);
  state.automationRules.splice(0, state.automationRules.length, ...snapshot.automationRules);
  state.aiRecommendations.splice(0, state.aiRecommendations.length, ...snapshot.aiRecommendations);
  state.campaigns.splice(0, state.campaigns.length, ...snapshot.campaigns);
  state.campaignRecipients.splice(0, state.campaignRecipients.length, ...snapshot.campaignRecipients);
  state.messageLogs.splice(0, state.messageLogs.length, ...snapshot.messageLogs);
  state.productCatalog.splice(0, state.productCatalog.length, ...snapshot.productCatalog);
  state.technicians.splice(0, state.technicians.length, ...snapshot.technicians);
  state.jobTasks.splice(0, state.jobTasks.length, ...snapshot.jobTasks);
  state.jobProducts.splice(0, state.jobProducts.length, ...snapshot.jobProducts);
  state.scheduleSlots.splice(0, state.scheduleSlots.length, ...snapshot.scheduleSlots);
  state.activityEvents.splice(0, state.activityEvents.length, ...snapshot.activityEvents);
}

function getRows(tableName: TableName): AnyTestRecord[] {
  switch (tableName) {
    case "companies":
      return state.companies;
    case "users":
      return state.users;
    case "refreshTokens":
      return state.refreshTokens;
    case "customers":
      return state.customers;
    case "properties":
      return state.properties;
    case "assets":
      return state.assets;
    case "jobs":
      return state.jobs;
    case "importSessions":
      return state.importSessions;
    case "estimates":
      return state.estimates;
    case "estimateItems":
      return state.estimateItems;
    case "invoices":
      return state.invoices;
    case "invoiceItems":
      return state.invoiceItems;
    case "payments":
      return state.payments;
    case "jobNotes":
      return state.jobNotes;
    case "jobPhotos":
      return state.jobPhotos;
    case "serviceAgreementTemplates":
      return state.serviceAgreementTemplates;
    case "maintenancePlans":
      return state.maintenancePlans;
    case "maintenanceVisits":
      return state.maintenanceVisits;
    case "automationRules":
      return state.automationRules;
    case "aiRecommendations":
      return state.aiRecommendations;
    case "campaigns":
      return state.campaigns;
    case "campaignRecipients":
      return state.campaignRecipients;
    case "messageLogs":
      return state.messageLogs;
    case "productCatalog":
      return state.productCatalog;
    case "technicians":
      return state.technicians;
    case "jobTasks":
      return state.jobTasks;
    case "jobProducts":
      return state.jobProducts;
    case "scheduleSlots":
      return state.scheduleSlots;
    case "activityEvents":
      return state.activityEvents;
  }
}

function sortRows<T extends Record<string, unknown>>(rows: T[], definition: OrderByDefinition): T[] {
  return [...rows].sort((left, right) => {
    const leftValue = left[definition.field] as string | number | Date | null | undefined;
    const rightValue = right[definition.field] as string | number | Date | null | undefined;

    if (leftValue === rightValue) {
      return 0;
    }

    if (leftValue === null || leftValue === undefined) {
      return 1;
    }

    if (rightValue === null || rightValue === undefined) {
      return -1;
    }

    if (definition.direction === "asc") {
      return leftValue > rightValue ? 1 : -1;
    }

    return leftValue > rightValue ? -1 : 1;
  });
}

function createCompanyRecord(values: Partial<TestCompanyRecord> & Pick<TestCompanyRecord, "name" | "slug">): TestCompanyRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    name: values.name,
    slug: values.slug,
    phone: values.phone ?? null,
    email: values.email ?? null,
    website: values.website ?? null,
    logoUrl: values.logoUrl ?? null,
    addressLine1: values.addressLine1 ?? null,
    addressLine2: values.addressLine2 ?? null,
    city: values.city ?? null,
    state: values.state ?? null,
    zip: values.zip ?? null,
    country: values.country ?? "US",
    timezone: values.timezone ?? "America/Chicago",
    stripeCustomerId: values.stripeCustomerId ?? null,
    stripeAccountId: values.stripeAccountId ?? null,
    settings: values.settings ?? {},
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createUserRecord(
  values: Partial<TestUserRecord> &
    Pick<TestUserRecord, "companyId" | "email" | "firstName" | "lastName">
): TestUserRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    email: values.email,
    passwordHash: values.passwordHash ?? null,
    passwordChangedAt: values.passwordChangedAt ?? null,
    firstName: values.firstName,
    lastName: values.lastName,
    phone: values.phone ?? null,
    role: values.role ?? "office",
    avatarUrl: values.avatarUrl ?? null,
    isActive: values.isActive ?? true,
    lastLoginAt: values.lastLoginAt ?? null,
    technicianId: values.technicianId ?? null,
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createRefreshTokenRecord(
  values: Partial<TestRefreshTokenRecord> &
    Pick<TestRefreshTokenRecord, "companyId" | "userId" | "tokenHash" | "expiresAt">
): TestRefreshTokenRecord {
  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    userId: values.userId,
    tokenHash: values.tokenHash,
    expiresAt: values.expiresAt,
    revokedAt: values.revokedAt ?? null,
    createdAt: values.createdAt ?? new Date()
  };
}

function createCustomerRecord(
  values: Partial<TestCustomerRecord> &
    Pick<TestCustomerRecord, "companyId" | "firstName" | "lastName">
): TestCustomerRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    firstName: values.firstName,
    lastName: values.lastName,
    displayName: values.displayName ?? null,
    email: values.email ?? null,
    phone: values.phone ?? null,
    altPhone: values.altPhone ?? null,
    leadSource: values.leadSource ?? null,
    referredBy: values.referredBy ?? null,
    tags: values.tags ?? [],
    internalNotes: values.internalNotes ?? null,
    lifetimeValue: values.lifetimeValue ?? "0.00",
    totalJobs: values.totalJobs ?? 0,
    lastServiceDate: values.lastServiceDate ?? null,
    firstServiceDate: values.firstServiceDate ?? null,
    prefersSms: values.prefersSms ?? true,
    prefersEmail: values.prefersEmail ?? true,
    doNotContact: values.doNotContact ?? false,
    stripeCustomerId: values.stripeCustomerId ?? null,
    importSessionId: values.importSessionId ?? null,
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createPropertyRecord(
  values: Partial<TestPropertyRecord> &
    Pick<TestPropertyRecord, "companyId" | "customerId" | "addressLine1" | "city" | "state" | "zip">
): TestPropertyRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    customerId: values.customerId,
    addressLine1: values.addressLine1,
    addressLine2: values.addressLine2 ?? null,
    city: values.city,
    state: values.state,
    zip: values.zip,
    country: values.country ?? "US",
    lat: values.lat ?? null,
    lng: values.lng ?? null,
    type: values.type ?? "residential",
    sqft: values.sqft ?? null,
    yearBuilt: values.yearBuilt ?? null,
    accessNotes: values.accessNotes ?? null,
    notes: values.notes ?? null,
    isPrimary: values.isPrimary ?? false,
    isActive: values.isActive ?? true,
    importSessionId: values.importSessionId ?? null,
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createAssetRecord(
  values: Partial<TestAssetRecord> &
    Pick<TestAssetRecord, "companyId" | "customerId" | "propertyId" | "name" | "assetType">
): TestAssetRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    propertyId: values.propertyId,
    customerId: values.customerId,
    name: values.name,
    assetType: values.assetType,
    brand: values.brand ?? null,
    model: values.model ?? null,
    serialNumber: values.serialNumber ?? null,
    installDate: values.installDate ?? null,
    warrantyExpiration: values.warrantyExpiration ?? null,
    lastServiceDate: values.lastServiceDate ?? null,
    nextServiceDate: values.nextServiceDate ?? null,
    condition: values.condition ?? null,
    conditionNotes: values.conditionNotes ?? null,
    conditionScore: values.conditionScore ?? null,
    replacementProbability: values.replacementProbability ?? null,
    photoUrls: values.photoUrls ?? [],
    notes: values.notes ?? null,
    isActive: values.isActive ?? true,
    importSessionId: values.importSessionId ?? null,
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createJobRecord(
  values: Partial<TestJobRecord> &
    Pick<TestJobRecord, "companyId" | "customerId">
): TestJobRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    customerId: values.customerId,
    jobNumber: values.jobNumber ?? `JOB-${String(state.jobs.length + 1).padStart(4, "0")}`,
    propertyId: values.propertyId ?? null,
    assetId: values.assetId ?? null,
    technicianId: values.technicianId ?? null,
    assignedById: values.assignedById ?? null,
    type: values.type ?? "service_call",
    priority: values.priority ?? "normal",
    status: values.status ?? "lead",
    leadSource: values.leadSource ?? null,
    title: values.title ?? "Service Call",
    description: values.description ?? null,
    scheduledStart: values.scheduledStart ?? null,
    scheduledEnd: values.scheduledEnd ?? null,
    scheduledDurationMinutes: values.scheduledDurationMinutes ?? null,
    actualStart: values.actualStart ?? null,
    actualEnd: values.actualEnd ?? null,
    techNotes: values.techNotes ?? null,
    completionNotes: values.completionNotes ?? null,
    signatureUrl: values.signatureUrl ?? null,
    signedAt: values.signedAt ?? null,
    signedByName: values.signedByName ?? null,
    estimateTotal: values.estimateTotal ?? null,
    invoiceTotal: values.invoiceTotal ?? null,
    amountPaid: values.amountPaid ?? "0.00",
    maintenancePlanId: values.maintenancePlanId ?? null,
    parentJobId: values.parentJobId ?? null,
    tags: values.tags ?? [],
    importSessionId: values.importSessionId ?? null,
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createImportSessionRecord(
  values: Partial<TestImportSessionRecord> &
    Pick<TestImportSessionRecord, "companyId" | "fileName" | "fileUrl">
): TestImportSessionRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    createdById: values.createdById ?? null,
    entityType: values.entityType ?? "customers",
    status: values.status ?? "uploaded",
    fileName: values.fileName,
    fileUrl: values.fileUrl,
    totalRows: values.totalRows ?? 0,
    validRows: values.validRows ?? 0,
    errorRows: values.errorRows ?? 0,
    importedRows: values.importedRows ?? 0,
    skippedRows: values.skippedRows ?? 0,
    duplicateRows: values.duplicateRows ?? 0,
    columnMappings: values.columnMappings ?? {},
    validationErrors: values.validationErrors ?? [],
    aiInferences: values.aiInferences ?? {},
    rolledBackAt: values.rolledBackAt ?? null,
    rolledBackById: values.rolledBackById ?? null,
    completedAt: values.completedAt ?? null,
    errorMessage: values.errorMessage ?? null,
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createEstimateRecord(
  values: Partial<TestEstimateRecord> &
    Pick<TestEstimateRecord, "companyId" | "customerId">
): TestEstimateRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    estimateNumber: values.estimateNumber ?? `EST-${String(state.estimates.length + 1).padStart(4, "0")}`,
    jobId: values.jobId ?? null,
    customerId: values.customerId,
    propertyId: values.propertyId ?? null,
    createdById: values.createdById ?? null,
    status: values.status ?? "draft",
    tierLabel: values.tierLabel ?? null,
    tierGroupId: values.tierGroupId ?? null,
    isSelectedTier: values.isSelectedTier ?? false,
    subtotal: values.subtotal ?? "0.00",
    taxRate: values.taxRate ?? "0.0000",
    taxAmount: values.taxAmount ?? "0.00",
    discountAmount: values.discountAmount ?? "0.00",
    total: values.total ?? "0.00",
    title: values.title ?? null,
    messageToCustomer: values.messageToCustomer ?? null,
    internalNotes: values.internalNotes ?? null,
    approvalToken: values.approvalToken ?? null,
    approvedAt: values.approvedAt ?? null,
    approvedByName: values.approvedByName ?? null,
    approvedSignatureUrl: values.approvedSignatureUrl ?? null,
    declinedAt: values.declinedAt ?? null,
    declineReason: values.declineReason ?? null,
    expiresAt: values.expiresAt ?? null,
    sentAt: values.sentAt ?? null,
    viewedAt: values.viewedAt ?? null,
    followUpSentAt: values.followUpSentAt ?? null,
    financingOffered: values.financingOffered ?? false,
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createEstimateItemRecord(
  values: Partial<TestEstimateItemRecord> &
    Pick<TestEstimateItemRecord, "companyId" | "estimateId" | "name">
): TestEstimateItemRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    estimateId: values.estimateId,
    companyId: values.companyId,
    name: values.name,
    description: values.description ?? null,
    itemType: values.itemType ?? "service",
    quantity: values.quantity ?? "1.000",
    unitPrice: values.unitPrice ?? "0.00",
    total: values.total ?? "0.00",
    isTaxable: values.isTaxable ?? true,
    sortOrder: values.sortOrder ?? 0,
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createInvoiceRecord(
  values: Partial<TestInvoiceRecord> &
    Pick<TestInvoiceRecord, "companyId" | "customerId">
): TestInvoiceRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    invoiceNumber: values.invoiceNumber ?? `INV-${String(state.invoices.length + 1).padStart(4, "0")}`,
    jobId: values.jobId ?? null,
    estimateId: values.estimateId ?? null,
    customerId: values.customerId,
    createdById: values.createdById ?? null,
    status: values.status ?? "draft",
    subtotal: values.subtotal ?? "0.00",
    taxRate: values.taxRate ?? "0.0000",
    taxAmount: values.taxAmount ?? "0.00",
    discountAmount: values.discountAmount ?? "0.00",
    total: values.total ?? "0.00",
    amountPaid: values.amountPaid ?? "0.00",
    balanceDue: values.balanceDue ?? values.total ?? "0.00",
    issuedAt: values.issuedAt ?? null,
    dueAt: values.dueAt ?? null,
    sentAt: values.sentAt ?? null,
    viewedAt: values.viewedAt ?? null,
    paidAt: values.paidAt ?? null,
    stripePaymentLinkId: values.stripePaymentLinkId ?? null,
    stripePaymentLinkUrl: values.stripePaymentLinkUrl ?? null,
    paymentToken: values.paymentToken ?? null,
    reminder1SentAt: values.reminder1SentAt ?? null,
    reminder2SentAt: values.reminder2SentAt ?? null,
    reminder3SentAt: values.reminder3SentAt ?? null,
    title: values.title ?? null,
    messageToCustomer: values.messageToCustomer ?? null,
    internalNotes: values.internalNotes ?? null,
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createInvoiceItemRecord(
  values: Partial<TestInvoiceItemRecord> &
    Pick<TestInvoiceItemRecord, "companyId" | "invoiceId" | "name">
): TestInvoiceItemRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    invoiceId: values.invoiceId,
    companyId: values.companyId,
    name: values.name,
    description: values.description ?? null,
    itemType: values.itemType ?? "service",
    quantity: values.quantity ?? "1.000",
    unitPrice: values.unitPrice ?? "0.00",
    total: values.total ?? "0.00",
    isTaxable: values.isTaxable ?? true,
    sortOrder: values.sortOrder ?? 0,
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createPaymentRecord(
  values: Partial<TestPaymentRecord> &
    Pick<TestPaymentRecord, "companyId" | "invoiceId" | "customerId" | "amount">
): TestPaymentRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    invoiceId: values.invoiceId,
    customerId: values.customerId,
    collectedById: values.collectedById ?? null,
    amount: values.amount,
    method: values.method ?? "card",
    status: values.status ?? "pending",
    stripePaymentIntentId: values.stripePaymentIntentId ?? null,
    stripeChargeId: values.stripeChargeId ?? null,
    checkNumber: values.checkNumber ?? null,
    referenceNumber: values.referenceNumber ?? null,
    notes: values.notes ?? null,
    paidAt: values.paidAt ?? null,
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createJobNoteRecord(
  values: Partial<TestJobNoteRecord> &
    Pick<TestJobNoteRecord, "companyId" | "jobId" | "content">
): TestJobNoteRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    jobId: values.jobId,
    authorId: values.authorId ?? null,
    content: values.content,
    isInternal: values.isInternal ?? true,
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createJobPhotoRecord(
  values: Partial<TestJobPhotoRecord> &
    Pick<TestJobPhotoRecord, "companyId" | "jobId" | "url">
): TestJobPhotoRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    jobId: values.jobId,
    uploadedById: values.uploadedById ?? null,
    url: values.url,
    thumbnailUrl: values.thumbnailUrl ?? null,
    caption: values.caption ?? null,
    takenAt: values.takenAt ?? null,
    photoType: values.photoType ?? "general",
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createServiceAgreementTemplateRecord(
  values: Partial<TestServiceAgreementTemplateRecord> &
    Pick<TestServiceAgreementTemplateRecord, "companyId" | "name" | "visitsPerYear" | "frequency">
): TestServiceAgreementTemplateRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    name: values.name,
    description: values.description ?? null,
    includedServices: values.includedServices ?? [],
    visitsPerYear: values.visitsPerYear,
    frequency: values.frequency,
    monthlyPrice: values.monthlyPrice ?? null,
    annualPrice: values.annualPrice ?? null,
    stripeMthlyPriceId: values.stripeMthlyPriceId ?? null,
    stripeAnnualPriceId: values.stripeAnnualPriceId ?? null,
    sortOrder: values.sortOrder ?? 0,
    isActive: values.isActive ?? true,
    applicableAssetTypes: values.applicableAssetTypes ?? [],
    notes: values.notes ?? null,
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createMaintenancePlanRecord(
  values: Partial<TestMaintenancePlanRecord> &
    Pick<TestMaintenancePlanRecord, "companyId" | "customerId">
): TestMaintenancePlanRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    customerId: values.customerId,
    propertyId: values.propertyId ?? null,
    serviceAgreementTemplateId: values.serviceAgreementTemplateId ?? null,
    name: values.name ?? "Maintenance Plan",
    description: values.description ?? null,
    includedServices: values.includedServices ?? [],
    assetIds: values.assetIds ?? [],
    status: values.status ?? "active",
    frequency: values.frequency ?? "quarterly",
    price: values.price ?? null,
    billingCycle: values.billingCycle ?? "annual",
    stripeSubscriptionId: values.stripeSubscriptionId ?? null,
    stripePriceId: values.stripePriceId ?? null,
    stripeCurrentPeriodStart: values.stripeCurrentPeriodStart ?? null,
    stripeCurrentPeriodEnd: values.stripeCurrentPeriodEnd ?? null,
    stripeCancelAtPeriodEnd: values.stripeCancelAtPeriodEnd ?? false,
    startDate: values.startDate ?? now.toISOString().slice(0, 10),
    endDate: values.endDate ?? null,
    nextServiceDate: values.nextServiceDate ?? null,
    lastServiceDate: values.lastServiceDate ?? null,
    notes: values.notes ?? null,
    deletedAt: values.deletedAt ?? null,
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now
  };
}

function createMaintenanceVisitRecord(
  values: Partial<TestMaintenanceVisitRecord> &
    Pick<TestMaintenanceVisitRecord, "companyId" | "maintenancePlanId">
): TestMaintenanceVisitRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    maintenancePlanId: values.maintenancePlanId,
    jobId: values.jobId ?? null,
    scheduledDate: values.scheduledDate ?? null,
    completedDate: values.completedDate ?? null,
    notes: values.notes ?? null,
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createAutomationRuleRecord(
  values: Partial<TestAutomationRuleRecord> &
    Pick<TestAutomationRuleRecord, "companyId" | "ruleType">
): TestAutomationRuleRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    ruleType: values.ruleType,
    isEnabled: values.isEnabled ?? false,
    delayHours: values.delayHours ?? null,
    thresholdDays: values.thresholdDays ?? null,
    config: values.config ?? {},
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createAiRecommendationRecord(
  values: Partial<TestAiRecommendationRecord> &
    Pick<TestAiRecommendationRecord, "companyId" | "type" | "headline" | "body">
): TestAiRecommendationRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    type: values.type,
    status: values.status ?? "pending",
    customerId: values.customerId ?? null,
    propertyId: values.propertyId ?? null,
    assetId: values.assetId ?? null,
    jobId: values.jobId ?? null,
    estimateId: values.estimateId ?? null,
    invoiceId: values.invoiceId ?? null,
    estimatedRevenue: values.estimatedRevenue ?? null,
    headline: values.headline,
    body: values.body,
    suggestedAction: values.suggestedAction ?? null,
    suggestedMessage: values.suggestedMessage ?? null,
    urgencyScore: values.urgencyScore ?? null,
    confidenceScore: values.confidenceScore ?? null,
    actionedAt: values.actionedAt ?? null,
    actionedById: values.actionedById ?? null,
    dismissedAt: values.dismissedAt ?? null,
    snoozedUntil: values.snoozedUntil ?? null,
    expiresAt: values.expiresAt ?? null,
    sourceEventIds: values.sourceEventIds ?? [],
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createCampaignRecord(
  values: Partial<TestCampaignRecord> &
    Pick<TestCampaignRecord, "companyId" | "type" | "name">
): TestCampaignRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    createdById: values.createdById ?? null,
    type: values.type,
    status: values.status ?? "draft",
    name: values.name,
    subject: values.subject ?? null,
    body: values.body ?? "",
    channel: values.channel ?? "sms",
    isAiGenerated: values.isAiGenerated ?? false,
    aiRecommendationId: values.aiRecommendationId ?? null,
    scheduledAt: values.scheduledAt ?? null,
    sentAt: values.sentAt ?? null,
    recipientCount: values.recipientCount ?? 0,
    deliveredCount: values.deliveredCount ?? 0,
    openedCount: values.openedCount ?? 0,
    repliedCount: values.repliedCount ?? 0,
    convertedCount: values.convertedCount ?? 0,
    revenueAttributed: values.revenueAttributed ?? "0.00",
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createCampaignRecipientRecord(
  values: Partial<TestCampaignRecipientRecord> &
    Pick<TestCampaignRecipientRecord, "campaignId" | "customerId" | "companyId">
): TestCampaignRecipientRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    campaignId: values.campaignId,
    customerId: values.customerId,
    companyId: values.companyId,
    sentAt: values.sentAt ?? null,
    deliveredAt: values.deliveredAt ?? null,
    openedAt: values.openedAt ?? null,
    repliedAt: values.repliedAt ?? null,
    convertedAt: values.convertedAt ?? null,
    conversionJobId: values.conversionJobId ?? null,
    sentToPhone: values.sentToPhone ?? null,
    sentToEmail: values.sentToEmail ?? null,
    unsubscribedAt: values.unsubscribedAt ?? null,
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createMessageLogRecord(
  values: Partial<TestMessageLogRecord> &
    Pick<TestMessageLogRecord, "companyId" | "channel" | "direction" | "toAddress" | "body">
): TestMessageLogRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    customerId: values.customerId ?? null,
    jobId: values.jobId ?? null,
    campaignId: values.campaignId ?? null,
    channel: values.channel,
    direction: values.direction,
    toAddress: values.toAddress,
    fromAddress: values.fromAddress ?? null,
    subject: values.subject ?? null,
    body: values.body,
    providerMessageId: values.providerMessageId ?? null,
    providerStatus: values.providerStatus ?? null,
    sentAt: values.sentAt ?? null,
    deliveredAt: values.deliveredAt ?? null,
    failedAt: values.failedAt ?? null,
    failureReason: values.failureReason ?? null,
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createProductCatalogRecord(
  values: Partial<TestProductCatalogRecord> &
    Pick<TestProductCatalogRecord, "companyId" | "name">
): TestProductCatalogRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    name: values.name,
    description: values.description ?? null,
    category: values.category ?? "service",
    sku: values.sku ?? null,
    unitPrice: values.unitPrice ?? "0.00",
    cost: values.cost ?? null,
    unit: values.unit ?? "each",
    isTaxable: values.isTaxable ?? true,
    isActive: values.isActive ?? true,
    applicableAssetTypes: values.applicableAssetTypes ?? [],
    sortOrder: values.sortOrder ?? 0,
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createTechnicianRecord(
  values: Partial<TestTechnicianRecord> &
    Pick<TestTechnicianRecord, "companyId" | "firstName" | "lastName" | "phone">
): TestTechnicianRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    userId: values.userId ?? null,
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email ?? null,
    phone: values.phone,
    avatarUrl: values.avatarUrl ?? null,
    skills: values.skills ?? [],
    serviceAreaIds: values.serviceAreaIds ?? [],
    serviceZipCodes: values.serviceZipCodes ?? [],
    hoursPerDay: values.hoursPerDay ?? "8",
    totalJobsCompleted: values.totalJobsCompleted ?? 0,
    avgJobDurationMinutes: values.avgJobDurationMinutes ?? null,
    estimateCloseRate: values.estimateCloseRate ?? null,
    avgTicketValue: values.avgTicketValue ?? null,
    status: values.status ?? "active",
    calendarColor: values.calendarColor ?? "#6366f1",
    notes: values.notes ?? null,
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createJobTaskRecord(
  values: Partial<TestJobTaskRecord> &
    Pick<TestJobTaskRecord, "companyId" | "jobId" | "title">
): TestJobTaskRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    jobId: values.jobId,
    assignedToId: values.assignedToId ?? null,
    title: values.title,
    description: values.description ?? null,
    status: values.status ?? "pending",
    isRequired: values.isRequired ?? false,
    completedAt: values.completedAt ?? null,
    completedById: values.completedById ?? null,
    estimatedMinutes: values.estimatedMinutes ?? null,
    actualMinutes: values.actualMinutes ?? null,
    sortOrder: values.sortOrder ?? 0,
    notes: values.notes ?? null,
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createJobProductRecord(
  values: Partial<TestJobProductRecord> &
    Pick<TestJobProductRecord, "companyId" | "jobId" | "name" | "unitPrice" | "total">
): TestJobProductRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    jobId: values.jobId,
    productCatalogId: values.productCatalogId ?? null,
    name: values.name,
    description: values.description ?? null,
    category: values.category ?? "service",
    quantity: values.quantity ?? "1.000",
    unitPrice: values.unitPrice,
    total: values.total,
    isTaxable: values.isTaxable ?? true,
    addedById: values.addedById ?? null,
    isUpsell: values.isUpsell ?? false,
    upsellApproved: values.upsellApproved ?? false,
    upsellApprovedAt: values.upsellApprovedAt ?? null,
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createScheduleSlotRecord(
  values: Partial<TestScheduleSlotRecord> &
    Pick<TestScheduleSlotRecord, "companyId" | "technicianId" | "startTime" | "endTime">
): TestScheduleSlotRecord {
  const now = new Date();

  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    technicianId: values.technicianId,
    jobId: values.jobId ?? null,
    isBlockedTime: values.isBlockedTime ?? false,
    blockReason: values.blockReason ?? null,
    startTime: values.startTime,
    endTime: values.endTime,
    travelMinutesBefore: values.travelMinutesBefore ?? 0,
    isConfirmed: values.isConfirmed ?? false,
    notes: values.notes ?? null,
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now,
    deletedAt: values.deletedAt ?? null
  };
}

function createActivityEventRecord(
  values: Partial<TestActivityEventRecord> &
    Pick<TestActivityEventRecord, "companyId" | "eventType" | "entityType" | "entityId" | "summary">
): TestActivityEventRecord {
  return {
    id: values.id ?? nextId(),
    companyId: values.companyId,
    eventType: values.eventType,
    actorId: values.actorId ?? null,
    actorType: values.actorType ?? "user",
    actorName: values.actorName ?? null,
    entityType: values.entityType,
    entityId: values.entityId,
    customerId: values.customerId ?? null,
    jobId: values.jobId ?? null,
    estimateId: values.estimateId ?? null,
    invoiceId: values.invoiceId ?? null,
    payload: values.payload ?? {},
    summary: values.summary,
    occurredAt: values.occurredAt ?? new Date()
  };
}

function createRow(tableName: TableName, values: Record<string, unknown>): AnyTestRecord {
  switch (tableName) {
    case "companies":
      return createCompanyRecord(values as Partial<TestCompanyRecord> & Pick<TestCompanyRecord, "name" | "slug">);
    case "users":
      return createUserRecord(
        values as Partial<TestUserRecord> & Pick<TestUserRecord, "companyId" | "email" | "firstName" | "lastName">
      );
    case "refreshTokens":
      return createRefreshTokenRecord(
        values as Partial<TestRefreshTokenRecord> &
          Pick<TestRefreshTokenRecord, "companyId" | "userId" | "tokenHash" | "expiresAt">
      );
    case "customers":
      return createCustomerRecord(
        values as Partial<TestCustomerRecord> & Pick<TestCustomerRecord, "companyId" | "firstName" | "lastName">
      );
    case "properties":
      return createPropertyRecord(
        values as Partial<TestPropertyRecord> &
          Pick<TestPropertyRecord, "companyId" | "customerId" | "addressLine1" | "city" | "state" | "zip">
      );
    case "assets":
      return createAssetRecord(
        values as Partial<TestAssetRecord> &
          Pick<TestAssetRecord, "companyId" | "customerId" | "propertyId" | "name" | "assetType">
      );
    case "jobs":
      return createJobRecord(values as Partial<TestJobRecord> & Pick<TestJobRecord, "companyId" | "customerId">);
    case "importSessions":
      return createImportSessionRecord(
        values as Partial<TestImportSessionRecord> &
          Pick<TestImportSessionRecord, "companyId" | "fileName" | "fileUrl">
      );
    case "estimates":
      return createEstimateRecord(
        values as Partial<TestEstimateRecord> & Pick<TestEstimateRecord, "companyId" | "customerId">
      );
    case "estimateItems":
      return createEstimateItemRecord(
        values as Partial<TestEstimateItemRecord> &
          Pick<TestEstimateItemRecord, "companyId" | "estimateId" | "name">
      );
    case "invoices":
      return createInvoiceRecord(
        values as Partial<TestInvoiceRecord> & Pick<TestInvoiceRecord, "companyId" | "customerId">
      );
    case "invoiceItems":
      return createInvoiceItemRecord(
        values as Partial<TestInvoiceItemRecord> &
          Pick<TestInvoiceItemRecord, "companyId" | "invoiceId" | "name">
      );
    case "payments":
      return createPaymentRecord(
        values as Partial<TestPaymentRecord> &
          Pick<TestPaymentRecord, "companyId" | "invoiceId" | "customerId" | "amount">
      );
    case "jobNotes":
      return createJobNoteRecord(
        values as Partial<TestJobNoteRecord> & Pick<TestJobNoteRecord, "companyId" | "jobId" | "content">
      );
    case "jobPhotos":
      return createJobPhotoRecord(
        values as Partial<TestJobPhotoRecord> & Pick<TestJobPhotoRecord, "companyId" | "jobId" | "url">
      );
    case "serviceAgreementTemplates":
      return createServiceAgreementTemplateRecord(
        values as Partial<TestServiceAgreementTemplateRecord> &
          Pick<TestServiceAgreementTemplateRecord, "companyId" | "name" | "visitsPerYear" | "frequency">
      );
    case "maintenancePlans":
      return createMaintenancePlanRecord(
        values as Partial<TestMaintenancePlanRecord> & Pick<TestMaintenancePlanRecord, "companyId" | "customerId">
      );
    case "maintenanceVisits":
      return createMaintenanceVisitRecord(
        values as Partial<TestMaintenanceVisitRecord> &
          Pick<TestMaintenanceVisitRecord, "companyId" | "maintenancePlanId">
      );
    case "automationRules":
      return createAutomationRuleRecord(
        values as Partial<TestAutomationRuleRecord> &
          Pick<TestAutomationRuleRecord, "companyId" | "ruleType">
      );
    case "aiRecommendations":
      return createAiRecommendationRecord(
        values as Partial<TestAiRecommendationRecord> &
          Pick<TestAiRecommendationRecord, "companyId" | "type" | "headline" | "body">
      );
    case "campaigns":
      return createCampaignRecord(
        values as Partial<TestCampaignRecord> &
          Pick<TestCampaignRecord, "companyId" | "type" | "name">
      );
    case "campaignRecipients":
      return createCampaignRecipientRecord(
        values as Partial<TestCampaignRecipientRecord> &
          Pick<TestCampaignRecipientRecord, "campaignId" | "customerId" | "companyId">
      );
    case "messageLogs":
      return createMessageLogRecord(
        values as Partial<TestMessageLogRecord> &
          Pick<TestMessageLogRecord, "companyId" | "channel" | "direction" | "toAddress" | "body">
      );
    case "productCatalog":
      return createProductCatalogRecord(
        values as Partial<TestProductCatalogRecord> &
          Pick<TestProductCatalogRecord, "companyId" | "name">
      );
    case "technicians":
      return createTechnicianRecord(
        values as Partial<TestTechnicianRecord> &
          Pick<TestTechnicianRecord, "companyId" | "firstName" | "lastName" | "phone">
      );
    case "jobTasks":
      return createJobTaskRecord(
        values as Partial<TestJobTaskRecord> &
          Pick<TestJobTaskRecord, "companyId" | "jobId" | "title">
      );
    case "jobProducts":
      return createJobProductRecord(
        values as Partial<TestJobProductRecord> &
          Pick<TestJobProductRecord, "companyId" | "jobId" | "name" | "unitPrice" | "total">
      );
    case "scheduleSlots":
      return createScheduleSlotRecord(
        values as Partial<TestScheduleSlotRecord> &
          Pick<TestScheduleSlotRecord, "companyId" | "technicianId" | "startTime" | "endTime">
      );
    case "activityEvents":
      return createActivityEventRecord(
        values as Partial<TestActivityEventRecord> &
          Pick<TestActivityEventRecord, "companyId" | "eventType" | "entityType" | "entityId" | "summary">
      );
  }
}

function createSelectChain<T extends Record<string, unknown>>(rows: T[]) {
  let filteredRows = [...rows];

  const chain = {
    where(predicate: Predicate<T>) {
      filteredRows = filteredRows.filter(predicate);
      return chain;
    },
    orderBy(definition: OrderByDefinition) {
      return Promise.resolve(sortRows(filteredRows, definition));
    },
    limit(limitCount: number) {
      return Promise.resolve(filteredRows.slice(0, limitCount));
    },
    for(_lockStrength: string) {
      return chain;
    },
    then<TResult1 = T[], TResult2 = never>(
      onfulfilled?: ((value: T[]) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ) {
      return Promise.resolve(filteredRows).then(onfulfilled, onrejected);
    }
  };

  return chain;
}

function createInsertChain(tableName: TableName) {
  return {
    values(values: Record<string, unknown> | Array<Record<string, unknown>>) {
      const records = (Array.isArray(values) ? values : [values]).map((value) => createRow(tableName, value));
      const targetRows = getRows(tableName);
      targetRows.push(...records);

      return {
        returning: () => Promise.resolve(records)
      };
    }
  };
}

function createUpdateChain<T extends Record<string, unknown>>(tableName: TableName) {
  return {
    set(values: Partial<T>) {
      return {
        where(predicate: Predicate<T>) {
          const rows = (getRows(tableName) as unknown as T[]).filter(predicate);

          for (const row of rows) {
            Object.assign(row, values);
          }

          return {
            returning: () => Promise.resolve(rows)
          };
        }
      };
    }
  };
}

const operators = {
  and<T>(...predicates: Array<Predicate<T>>): Predicate<T> {
    return (row: T) => predicates.every((predicate) => predicate(row));
  },
  eq<T>(field: keyof T, value: T[keyof T]): Predicate<T> {
    return (row: T) => row[field] === value;
  },
  isNull<T>(field: keyof T): Predicate<T> {
    return (row: T) => row[field] === null;
  }
};

interface TestDb {
  select(): {
    from(table: MockTable): ReturnType<typeof createSelectChain<Record<string, unknown>>>;
  };
  insert(table: MockTable): ReturnType<typeof createInsertChain>;
  update(table: MockTable): ReturnType<typeof createUpdateChain<Record<string, unknown>>>;
  transaction<T>(callback: (tx: TestDb) => Promise<T>): Promise<T>;
  query: {
    users: {
      findFirst(args: {
        where: (
          table: typeof usersTable,
          queryOperators: typeof operators
        ) => Predicate<TestUserRecord>;
      }): Promise<TestUserRecord | null>;
    };
    companies: {
      findFirst(args: {
        where: (
          table: typeof companiesTable,
          queryOperators: typeof operators
        ) => Predicate<TestCompanyRecord>;
      }): Promise<TestCompanyRecord | null>;
    };
    importSessions: {
      findFirst(args: {
        where: (
          table: typeof importSessionsTable,
          queryOperators: typeof operators
        ) => Predicate<TestImportSessionRecord>;
      }): Promise<TestImportSessionRecord | null>;
    };
    automationRules: {
      findFirst(args: {
        where: (
          table: typeof automationRulesTable,
          queryOperators: typeof operators
        ) => Predicate<TestAutomationRuleRecord>;
      }): Promise<TestAutomationRuleRecord | null>;
    };
  };
}

export const db: TestDb = {
  select() {
    return {
      from(table: MockTable) {
        return createSelectChain(getRows(table.__name) as unknown as Array<Record<string, unknown>>);
      }
    };
  },
  insert(table: MockTable) {
    return createInsertChain(table.__name);
  },
  update(table: MockTable) {
    return createUpdateChain(table.__name);
  },
  async transaction<T>(callback: (tx: TestDb) => Promise<T>): Promise<T> {
    const snapshot = cloneState();

    try {
      return await callback(db);
    } catch (error) {
      restoreState(snapshot);
      throw error;
    }
  },
  query: {
    users: {
      async findFirst({
        where
      }: {
        where: (
          table: typeof usersTable,
          queryOperators: typeof operators
        ) => Predicate<TestUserRecord>;
      }): Promise<TestUserRecord | null> {
        const predicate = where(usersTable, operators);
        return state.users.find((row) => predicate(row)) ?? null;
      }
    },
    companies: {
      async findFirst({
        where
      }: {
        where: (
          table: typeof companiesTable,
          queryOperators: typeof operators
        ) => Predicate<TestCompanyRecord>;
      }): Promise<TestCompanyRecord | null> {
        const predicate = where(companiesTable, operators);
        return state.companies.find((row) => predicate(row)) ?? null;
      }
    },
    importSessions: {
      async findFirst({
        where
      }: {
        where: (
          table: typeof importSessionsTable,
          queryOperators: typeof operators
        ) => Predicate<TestImportSessionRecord>;
      }): Promise<TestImportSessionRecord | null> {
        const predicate = where(importSessionsTable, operators);
        return state.importSessions.find((row) => predicate(row)) ?? null;
      }
    },
    automationRules: {
      async findFirst({
        where
      }: {
        where: (
          table: typeof automationRulesTable,
          queryOperators: typeof operators
        ) => Predicate<TestAutomationRuleRecord>;
      }): Promise<TestAutomationRuleRecord | null> {
        const predicate = where(automationRulesTable, operators);
        return state.automationRules.find((row) => predicate(row)) ?? null;
      }
    }
  }
};

export const companies = companiesTable;
export const users = usersTable;
export const refreshTokens = refreshTokensTable;
export const customers = customersTable;
export const properties = propertiesTable;
export const assets = assetsTable;
export const jobs = jobsTable;
export const importSessions = importSessionsTable;
export const estimates = estimatesTable;
export const estimateItems = estimateItemsTable;
export const invoices = invoicesTable;
export const invoiceItems = invoiceItemsTable;
export const payments = paymentsTable;
export const jobNotes = jobNotesTable;
export const jobPhotos = jobPhotosTable;
export const serviceAgreementTemplates = serviceAgreementTemplatesTable;
export const maintenancePlans = maintenancePlansTable;
export const maintenanceVisits = maintenanceVisitsTable;
export const automationRules = automationRulesTable;
export const aiRecommendations = aiRecommendationsTable;
export const campaigns = campaignsTable;
export const campaignRecipients = campaignRecipientsTable;
export const messageLogs = messageLogsTable;
export const productCatalog = productCatalogTable;
export const technicians = techniciansTable;
export const jobTasks = jobTasksTable;
export const jobProducts = jobProductsTable;
export const scheduleSlots = scheduleSlotsTable;
export const activityEvents = activityEventsTable;

export async function emitEvent(event: Omit<TestActivityEventRecord, "id" | "occurredAt"> & {
  occurredAt?: Date;
}): Promise<void> {
  state.activityEvents.push(createActivityEventRecord(event));
}

export async function emitEventWithExecutor(
  _executor: unknown,
  event: Omit<TestActivityEventRecord, "id" | "occurredAt"> & {
    occurredAt?: Date;
  }
): Promise<void> {
  state.activityEvents.push(createActivityEventRecord(event));
}

export async function markInvoiceOverdueIfNeeded(
  companyId: string,
  invoiceId: string
): Promise<TestInvoiceRecord | null> {
  const invoice =
    state.invoices.find(
      (row) => row.companyId === companyId && row.id === invoiceId && row.deletedAt === null
    ) ?? null;

  if (!invoice) {
    return null;
  }

  if (invoice.status !== "sent" || !invoice.dueAt || invoice.dueAt.getTime() > Date.now()) {
    return invoice;
  }

  invoice.status = "overdue";
  invoice.updatedAt = new Date();

  state.activityEvents.push(
    createActivityEventRecord({
      companyId: invoice.companyId,
      eventType: "invoice.overdue",
      actorType: "system",
      entityType: "invoice",
      entityId: invoice.id,
      customerId: invoice.customerId,
      invoiceId: invoice.id,
      ...(invoice.jobId ? { jobId: invoice.jobId } : {}),
      ...(invoice.estimateId ? { estimateId: invoice.estimateId } : {}),
      payload: {},
      summary: `Invoice ${invoice.invoiceNumber} overdue`
    })
  );

  return invoice;
}

export const REVENUE_SUMMARY_CACHE_TTL_SECONDS = 300;

export interface RevenueSummaryTopRecommendationRecord {
  id: string;
  headline: string;
  urgencyScore: number | null;
}

export interface RevenueSummaryCountBucketRecord {
  count: number;
  estimatedRevenue: string;
  topRecommendations: RevenueSummaryTopRecommendationRecord[];
}

export interface RevenueSummaryValueBucketRecord {
  count: number;
  totalValue: string;
  topRecommendations: RevenueSummaryTopRecommendationRecord[];
}

export interface RevenueSummaryCacheEntry {
  dormantCustomers: RevenueSummaryCountBucketRecord;
  unsoldEstimates: RevenueSummaryValueBucketRecord;
  unpaidInvoices: RevenueSummaryValueBucketRecord;
  agingAssets: RevenueSummaryCountBucketRecord;
  maintenancePlanOpportunities: RevenueSummaryCountBucketRecord;
  totalOpportunityValue: string;
  generatedAt: string;
}

export function buildRevenueSummaryCacheKey(companyId: string): string {
  return `revenue-summary:${companyId}`;
}

function toMoney(value: Decimal): string {
  return value.toFixed(2);
}

function isVisibleInRevenueDashboard(row: TestAiRecommendationRecord, now: Date): boolean {
  if (row.deletedAt !== null || row.status !== "pending") {
    return false;
  }

  return row.snoozedUntil === null || row.snoozedUntil.getTime() <= now.getTime();
}

function buildTopRecommendations(rows: TestAiRecommendationRecord[]): RevenueSummaryTopRecommendationRecord[] {
  return [...rows]
    .sort((left, right) => {
      const leftUrgency = left.urgencyScore ?? -1;
      const rightUrgency = right.urgencyScore ?? -1;

      if (rightUrgency !== leftUrgency) {
        return rightUrgency - leftUrgency;
      }

      return right.createdAt.getTime() - left.createdAt.getTime();
    })
    .slice(0, 5)
    .map((row) => ({
      id: row.id,
      headline: row.headline,
      urgencyScore: row.urgencyScore
    }));
}

function sumEstimatedRevenue(rows: TestAiRecommendationRecord[]): string {
  return toMoney(
    rows.reduce((sum, row) => sum.add(new Decimal(row.estimatedRevenue ?? "0")), new Decimal(0))
  );
}

function sumEstimateTotals(rows: TestAiRecommendationRecord[]): string {
  return toMoney(
    rows.reduce((sum, row) => {
      const estimateTotal =
        row.estimateId !== null
          ? state.estimates.find((estimate) => estimate.id === row.estimateId)?.total ?? null
          : null;

      return sum.add(new Decimal(estimateTotal ?? row.estimatedRevenue ?? "0"));
    }, new Decimal(0))
  );
}

function sumInvoiceBalances(rows: TestAiRecommendationRecord[]): string {
  return toMoney(
    rows.reduce((sum, row) => {
      const invoiceBalance =
        row.invoiceId !== null
          ? state.invoices.find((invoice) => invoice.id === row.invoiceId)?.balanceDue ?? null
          : null;

      return sum.add(new Decimal(invoiceBalance ?? row.estimatedRevenue ?? "0"));
    }, new Decimal(0))
  );
}

export async function computeRevenueSummarySnapshot(
  companyId: string,
  now: Date = new Date()
): Promise<RevenueSummaryCacheEntry> {
  const visibleRecommendations = state.aiRecommendations.filter(
    (row) => row.companyId === companyId && isVisibleInRevenueDashboard(row, now)
  );

  const dormantCustomers = visibleRecommendations.filter((row) => row.type === "reactivation");
  const unsoldEstimates = visibleRecommendations.filter((row) => row.type === "unsold_estimate");
  const unpaidInvoices = visibleRecommendations.filter((row) => row.type === "unpaid_invoice");
  const agingAssets = visibleRecommendations.filter((row) => row.type === "aging_asset");
  const maintenancePlanOpportunities = visibleRecommendations.filter(
    (row) => row.type === "maintenance_plan_offer"
  );

  const summary: RevenueSummaryCacheEntry = {
    dormantCustomers: {
      count: dormantCustomers.length,
      estimatedRevenue: sumEstimatedRevenue(dormantCustomers),
      topRecommendations: buildTopRecommendations(dormantCustomers)
    },
    unsoldEstimates: {
      count: unsoldEstimates.length,
      totalValue: sumEstimateTotals(unsoldEstimates),
      topRecommendations: buildTopRecommendations(unsoldEstimates)
    },
    unpaidInvoices: {
      count: unpaidInvoices.length,
      totalValue: sumInvoiceBalances(unpaidInvoices),
      topRecommendations: buildTopRecommendations(unpaidInvoices)
    },
    agingAssets: {
      count: agingAssets.length,
      estimatedRevenue: sumEstimatedRevenue(agingAssets),
      topRecommendations: buildTopRecommendations(agingAssets)
    },
    maintenancePlanOpportunities: {
      count: maintenancePlanOpportunities.length,
      estimatedRevenue: sumEstimatedRevenue(maintenancePlanOpportunities),
      topRecommendations: buildTopRecommendations(maintenancePlanOpportunities)
    },
    totalOpportunityValue: "0.00",
    generatedAt: now.toISOString()
  };

  summary.totalOpportunityValue = toMoney(
    new Decimal(summary.dormantCustomers.estimatedRevenue)
      .add(summary.unsoldEstimates.totalValue)
      .add(summary.unpaidInvoices.totalValue)
      .add(summary.agingAssets.estimatedRevenue)
      .add(summary.maintenancePlanOpportunities.estimatedRevenue)
  );

  return summary;
}

export async function listActiveCompanyIdsForRevenueSummary(
  since: Date,
  offset: number,
  limit: number
): Promise<string[]> {
  const activeCompanyIds = new Set(
    state.activityEvents
      .filter((row) => row.occurredAt.getTime() >= since.getTime())
      .map((row) => row.companyId)
  );

  const orderedCompanyIds = state.companies
    .filter((row) => row.deletedAt === null && activeCompanyIds.has(row.id))
    .map((row) => row.id);

  return orderedCompanyIds.slice(offset, offset + limit);
}

export function createDrizzleModuleMock() {
  const sqlTag = (
    _strings: TemplateStringsArray,
    ..._values: unknown[]
  ) => ({});

  return {
    and: <T>(...predicates: Array<Predicate<T>>): Predicate<T> => (row: T) =>
      predicates.every((predicate) => predicate(row)),
    asc: <T>(field: keyof T): OrderByDefinition => ({
      direction: "asc",
      field: String(field)
    }),
    desc: <T>(field: keyof T): OrderByDefinition => ({
      direction: "desc",
      field: String(field)
    }),
    eq: <T>(field: keyof T, value: T[keyof T]): Predicate<T> => (row: T) => row[field] === value,
    gt: <T>(field: keyof T, value: T[keyof T]): Predicate<T> => (row: T) =>
      (row[field] as string | number | Date) > (value as string | number | Date),
    isNull: <T>(field: keyof T): Predicate<T> => (row: T) => row[field] === null,
    sql: sqlTag
  };
}

export function createDbModuleMock() {
  return {
    db,
    companies,
    users,
    refreshTokens,
    customers,
    properties,
    assets,
    jobs,
    importSessions,
    estimates,
    estimateItems,
    invoices,
    invoiceItems,
    payments,
    jobNotes,
    jobPhotos,
    serviceAgreementTemplates,
    maintenancePlans,
    maintenanceVisits,
    automationRules,
    aiRecommendations,
    campaigns,
    campaignRecipients,
    messageLogs,
    productCatalog,
    technicians,
    jobTasks,
    jobProducts,
    scheduleSlots,
    activityEvents,
    emitEvent,
    emitEventWithExecutor,
    markInvoiceOverdueIfNeeded,
    REVENUE_SUMMARY_CACHE_TTL_SECONDS,
    buildRevenueSummaryCacheKey,
    computeRevenueSummarySnapshot,
    listActiveCompanyIdsForRevenueSummary
  };
}

export function resetTestState(): void {
  state.companies.length = 0;
  state.users.length = 0;
  state.refreshTokens.length = 0;
  state.customers.length = 0;
  state.properties.length = 0;
  state.assets.length = 0;
  state.jobs.length = 0;
  state.importSessions.length = 0;
  state.estimates.length = 0;
  state.estimateItems.length = 0;
  state.invoices.length = 0;
  state.invoiceItems.length = 0;
  state.payments.length = 0;
  state.jobNotes.length = 0;
  state.jobPhotos.length = 0;
  state.serviceAgreementTemplates.length = 0;
  state.maintenancePlans.length = 0;
  state.maintenanceVisits.length = 0;
  state.automationRules.length = 0;
  state.aiRecommendations.length = 0;
  state.campaigns.length = 0;
  state.campaignRecipients.length = 0;
  state.messageLogs.length = 0;
  state.productCatalog.length = 0;
  state.technicians.length = 0;
  state.jobTasks.length = 0;
  state.jobProducts.length = 0;
  state.scheduleSlots.length = 0;
  state.activityEvents.length = 0;
}

export function seedCompany(
  values: Partial<TestCompanyRecord> & Pick<TestCompanyRecord, "name" | "slug">
): TestCompanyRecord {
  const record = createCompanyRecord(values);
  state.companies.push(record);
  return record;
}

export function seedUser(
  values: Partial<TestUserRecord> & Pick<TestUserRecord, "companyId" | "email" | "firstName" | "lastName">
): TestUserRecord {
  const record = createUserRecord(values);
  state.users.push(record);
  return record;
}

export function seedRefreshToken(
  values: Partial<TestRefreshTokenRecord> &
    Pick<TestRefreshTokenRecord, "companyId" | "userId" | "tokenHash" | "expiresAt">
): TestRefreshTokenRecord {
  const record = createRefreshTokenRecord(values);
  state.refreshTokens.push(record);
  return record;
}

export function seedCustomer(
  values: Partial<TestCustomerRecord> &
    Pick<TestCustomerRecord, "companyId" | "firstName" | "lastName">
): TestCustomerRecord {
  const record = createCustomerRecord(values);
  state.customers.push(record);
  return record;
}

export function seedProperty(
  values: Partial<TestPropertyRecord> &
    Pick<TestPropertyRecord, "companyId" | "customerId" | "addressLine1" | "city" | "state" | "zip">
): TestPropertyRecord {
  const record = createPropertyRecord(values);
  state.properties.push(record);
  return record;
}

export function seedAsset(
  values: Partial<TestAssetRecord> &
    Pick<TestAssetRecord, "companyId" | "customerId" | "propertyId" | "name" | "assetType">
): TestAssetRecord {
  const record = createAssetRecord(values);
  state.assets.push(record);
  return record;
}

export function seedJob(
  values: Partial<TestJobRecord> &
    Pick<TestJobRecord, "companyId" | "customerId">
): TestJobRecord {
  const record = createJobRecord(values);
  state.jobs.push(record);
  return record;
}

export function seedImportSession(
  values: Partial<TestImportSessionRecord> &
    Pick<TestImportSessionRecord, "companyId" | "fileName" | "fileUrl">
): TestImportSessionRecord {
  const record = createImportSessionRecord(values);
  state.importSessions.push(record);
  return record;
}

export function seedEstimate(
  values: Partial<TestEstimateRecord> &
    Pick<TestEstimateRecord, "companyId" | "customerId">
): TestEstimateRecord {
  const record = createEstimateRecord(values);
  state.estimates.push(record);
  return record;
}

export function seedEstimateItem(
  values: Partial<TestEstimateItemRecord> &
    Pick<TestEstimateItemRecord, "companyId" | "estimateId" | "name">
): TestEstimateItemRecord {
  const record = createEstimateItemRecord(values);
  state.estimateItems.push(record);
  return record;
}

export function seedInvoice(
  values: Partial<TestInvoiceRecord> &
    Pick<TestInvoiceRecord, "companyId" | "customerId">
): TestInvoiceRecord {
  const record = createInvoiceRecord(values);
  state.invoices.push(record);
  return record;
}

export function seedInvoiceItem(
  values: Partial<TestInvoiceItemRecord> &
    Pick<TestInvoiceItemRecord, "companyId" | "invoiceId" | "name">
): TestInvoiceItemRecord {
  const record = createInvoiceItemRecord(values);
  state.invoiceItems.push(record);
  return record;
}

export function seedPayment(
  values: Partial<TestPaymentRecord> &
    Pick<TestPaymentRecord, "companyId" | "invoiceId" | "customerId" | "amount">
): TestPaymentRecord {
  const record = createPaymentRecord(values);
  state.payments.push(record);
  return record;
}

export function seedJobNote(
  values: Partial<TestJobNoteRecord> &
    Pick<TestJobNoteRecord, "companyId" | "jobId" | "content">
): TestJobNoteRecord {
  const record = createJobNoteRecord(values);
  state.jobNotes.push(record);
  return record;
}

export function seedJobPhoto(
  values: Partial<TestJobPhotoRecord> &
    Pick<TestJobPhotoRecord, "companyId" | "jobId" | "url">
): TestJobPhotoRecord {
  const record = createJobPhotoRecord(values);
  state.jobPhotos.push(record);
  return record;
}

export function seedServiceAgreementTemplate(
  values: Partial<TestServiceAgreementTemplateRecord> &
    Pick<TestServiceAgreementTemplateRecord, "companyId" | "name" | "visitsPerYear" | "frequency">
): TestServiceAgreementTemplateRecord {
  const record = createServiceAgreementTemplateRecord(values);
  state.serviceAgreementTemplates.push(record);
  return record;
}

export function seedMaintenancePlan(
  values: Partial<TestMaintenancePlanRecord> &
    Pick<TestMaintenancePlanRecord, "companyId" | "customerId">
): TestMaintenancePlanRecord {
  const record = createMaintenancePlanRecord(values);
  state.maintenancePlans.push(record);
  return record;
}

export function seedMaintenanceVisit(
  values: Partial<TestMaintenanceVisitRecord> &
    Pick<TestMaintenanceVisitRecord, "companyId" | "maintenancePlanId">
): TestMaintenanceVisitRecord {
  const record = createMaintenanceVisitRecord(values);
  state.maintenanceVisits.push(record);
  return record;
}

export function seedAutomationRule(
  values: Partial<TestAutomationRuleRecord> &
    Pick<TestAutomationRuleRecord, "companyId" | "ruleType">
): TestAutomationRuleRecord {
  const record = createAutomationRuleRecord(values);
  state.automationRules.push(record);
  return record;
}

export function seedAiRecommendation(
  values: Partial<TestAiRecommendationRecord> &
    Pick<TestAiRecommendationRecord, "companyId" | "type" | "headline" | "body">
): TestAiRecommendationRecord {
  const record = createAiRecommendationRecord(values);
  state.aiRecommendations.push(record);
  return record;
}

export function seedCampaign(
  values: Partial<TestCampaignRecord> &
    Pick<TestCampaignRecord, "companyId" | "type" | "name">
): TestCampaignRecord {
  const record = createCampaignRecord(values);
  state.campaigns.push(record);
  return record;
}

export function seedCampaignRecipient(
  values: Partial<TestCampaignRecipientRecord> &
    Pick<TestCampaignRecipientRecord, "campaignId" | "customerId" | "companyId">
): TestCampaignRecipientRecord {
  const record = createCampaignRecipientRecord(values);
  state.campaignRecipients.push(record);
  return record;
}

export function seedMessageLog(
  values: Partial<TestMessageLogRecord> &
    Pick<TestMessageLogRecord, "companyId" | "channel" | "direction" | "toAddress" | "body">
): TestMessageLogRecord {
  const record = createMessageLogRecord(values);
  state.messageLogs.push(record);
  return record;
}

export function seedProductCatalog(
  values: Partial<TestProductCatalogRecord> &
    Pick<TestProductCatalogRecord, "companyId" | "name">
): TestProductCatalogRecord {
  const record = createProductCatalogRecord(values);
  state.productCatalog.push(record);
  return record;
}

export function seedTechnician(
  values: Partial<TestTechnicianRecord> &
    Pick<TestTechnicianRecord, "companyId" | "firstName" | "lastName" | "phone">
): TestTechnicianRecord {
  const record = createTechnicianRecord(values);
  state.technicians.push(record);
  return record;
}

export function seedJobTask(
  values: Partial<TestJobTaskRecord> &
    Pick<TestJobTaskRecord, "companyId" | "jobId" | "title">
): TestJobTaskRecord {
  const record = createJobTaskRecord(values);
  state.jobTasks.push(record);
  return record;
}

export function seedJobProduct(
  values: Partial<TestJobProductRecord> &
    Pick<TestJobProductRecord, "companyId" | "jobId" | "name" | "unitPrice" | "total">
): TestJobProductRecord {
  const record = createJobProductRecord(values);
  state.jobProducts.push(record);
  return record;
}

export function seedScheduleSlot(
  values: Partial<TestScheduleSlotRecord> &
    Pick<TestScheduleSlotRecord, "companyId" | "technicianId" | "startTime" | "endTime">
): TestScheduleSlotRecord {
  const record = createScheduleSlotRecord(values);
  state.scheduleSlots.push(record);
  return record;
}

export function seedActivityEvent(
  values: Partial<TestActivityEventRecord> &
    Pick<TestActivityEventRecord, "companyId" | "eventType" | "entityType" | "entityId" | "summary">
): TestActivityEventRecord {
  const record = createActivityEventRecord(values);
  state.activityEvents.push(record);
  return record;
}

export function getTestState(): TestState {
  return state;
}
