import { randomUUID } from "node:crypto";

type Predicate<T> = (row: T) => boolean;

type TableName =
  | "companies"
  | "users"
  | "refreshTokens"
  | "customers"
  | "properties"
  | "assets"
  | "jobs"
  | "jobNotes"
  | "jobPhotos"
  | "maintenancePlans"
  | "technicians"
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

export interface TestMaintenancePlanRecord {
  id: string;
  companyId: string;
  customerId: string;
  propertyId: string | null;
  assetIds: string[] | null;
  status: "active" | "paused" | "expired" | "cancelled";
  frequency: "monthly" | "bi_monthly" | "quarterly" | "bi_annual" | "annual";
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
  | TestJobNoteRecord
  | TestJobPhotoRecord
  | TestMaintenancePlanRecord
  | TestTechnicianRecord
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
  | typeof jobNotesTable
  | typeof jobPhotosTable
  | typeof maintenancePlansTable
  | typeof techniciansTable
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
  jobNotes: TestJobNoteRecord[];
  jobPhotos: TestJobPhotoRecord[];
  maintenancePlans: TestMaintenancePlanRecord[];
  technicians: TestTechnicianRecord[];
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

const maintenancePlansTable = {
  __name: "maintenancePlans",
  id: "id",
  companyId: "companyId",
  customerId: "customerId",
  propertyId: "propertyId",
  assetIds: "assetIds",
  status: "status",
  frequency: "frequency",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
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
  jobNotes: [],
  jobPhotos: [],
  maintenancePlans: [],
  technicians: [],
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
  state.jobNotes.splice(0, state.jobNotes.length, ...snapshot.jobNotes);
  state.jobPhotos.splice(0, state.jobPhotos.length, ...snapshot.jobPhotos);
  state.maintenancePlans.splice(0, state.maintenancePlans.length, ...snapshot.maintenancePlans);
  state.technicians.splice(0, state.technicians.length, ...snapshot.technicians);
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
    case "jobNotes":
      return state.jobNotes;
    case "jobPhotos":
      return state.jobPhotos;
    case "maintenancePlans":
      return state.maintenancePlans;
    case "technicians":
      return state.technicians;
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
    assetIds: values.assetIds ?? [],
    status: values.status ?? "active",
    frequency: values.frequency ?? "quarterly",
    deletedAt: values.deletedAt ?? null,
    createdAt: values.createdAt ?? now,
    updatedAt: values.updatedAt ?? now
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
    case "jobNotes":
      return createJobNoteRecord(
        values as Partial<TestJobNoteRecord> & Pick<TestJobNoteRecord, "companyId" | "jobId" | "content">
      );
    case "jobPhotos":
      return createJobPhotoRecord(
        values as Partial<TestJobPhotoRecord> & Pick<TestJobPhotoRecord, "companyId" | "jobId" | "url">
      );
    case "maintenancePlans":
      return createMaintenancePlanRecord(
        values as Partial<TestMaintenancePlanRecord> & Pick<TestMaintenancePlanRecord, "companyId" | "customerId">
      );
    case "technicians":
      return createTechnicianRecord(
        values as Partial<TestTechnicianRecord> &
          Pick<TestTechnicianRecord, "companyId" | "firstName" | "lastName" | "phone">
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
export const jobNotes = jobNotesTable;
export const jobPhotos = jobPhotosTable;
export const maintenancePlans = maintenancePlansTable;
export const technicians = techniciansTable;
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
    jobNotes,
    jobPhotos,
    maintenancePlans,
    technicians,
    scheduleSlots,
    activityEvents,
    emitEvent,
    emitEventWithExecutor
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
  state.jobNotes.length = 0;
  state.jobPhotos.length = 0;
  state.maintenancePlans.length = 0;
  state.technicians.length = 0;
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

export function seedMaintenancePlan(
  values: Partial<TestMaintenancePlanRecord> &
    Pick<TestMaintenancePlanRecord, "companyId" | "customerId">
): TestMaintenancePlanRecord {
  const record = createMaintenancePlanRecord(values);
  state.maintenancePlans.push(record);
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
