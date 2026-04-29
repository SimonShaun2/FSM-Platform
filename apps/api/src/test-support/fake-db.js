import { randomUUID } from "node:crypto";
import { Decimal } from "decimal.js";
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
};
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
};
const refreshTokensTable = {
    __name: "refreshTokens",
    id: "id",
    companyId: "companyId",
    userId: "userId",
    tokenHash: "tokenHash",
    expiresAt: "expiresAt",
    revokedAt: "revokedAt",
    createdAt: "createdAt"
};
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
};
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
};
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
};
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
};
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
};
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
};
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
};
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
};
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
};
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
};
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
};
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
};
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
};
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
};
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
};
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
};
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
};
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
};
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
};
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
};
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
};
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
};
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
};
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
};
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
};
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
};
const state = {
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
function nextId() {
    return randomUUID();
}
function cloneState() {
    return structuredClone(state);
}
function restoreState(snapshot) {
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
function getRows(tableName) {
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
function sortRows(rows, definition) {
    return [...rows].sort((left, right) => {
        const leftValue = left[definition.field];
        const rightValue = right[definition.field];
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
function createCompanyRecord(values) {
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
function createUserRecord(values) {
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
function createRefreshTokenRecord(values) {
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
function createCustomerRecord(values) {
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
function createPropertyRecord(values) {
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
function createAssetRecord(values) {
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
function createJobRecord(values) {
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
function createImportSessionRecord(values) {
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
function createEstimateRecord(values) {
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
function createEstimateItemRecord(values) {
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
function createInvoiceRecord(values) {
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
function createInvoiceItemRecord(values) {
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
function createPaymentRecord(values) {
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
function createJobNoteRecord(values) {
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
function createJobPhotoRecord(values) {
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
function createServiceAgreementTemplateRecord(values) {
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
function createMaintenancePlanRecord(values) {
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
function createMaintenanceVisitRecord(values) {
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
function createAutomationRuleRecord(values) {
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
function createAiRecommendationRecord(values) {
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
function createCampaignRecord(values) {
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
function createCampaignRecipientRecord(values) {
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
function createMessageLogRecord(values) {
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
function createProductCatalogRecord(values) {
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
function createTechnicianRecord(values) {
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
function createJobTaskRecord(values) {
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
function createJobProductRecord(values) {
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
function createScheduleSlotRecord(values) {
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
function createActivityEventRecord(values) {
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
function createRow(tableName, values) {
    switch (tableName) {
        case "companies":
            return createCompanyRecord(values);
        case "users":
            return createUserRecord(values);
        case "refreshTokens":
            return createRefreshTokenRecord(values);
        case "customers":
            return createCustomerRecord(values);
        case "properties":
            return createPropertyRecord(values);
        case "assets":
            return createAssetRecord(values);
        case "jobs":
            return createJobRecord(values);
        case "importSessions":
            return createImportSessionRecord(values);
        case "estimates":
            return createEstimateRecord(values);
        case "estimateItems":
            return createEstimateItemRecord(values);
        case "invoices":
            return createInvoiceRecord(values);
        case "invoiceItems":
            return createInvoiceItemRecord(values);
        case "payments":
            return createPaymentRecord(values);
        case "jobNotes":
            return createJobNoteRecord(values);
        case "jobPhotos":
            return createJobPhotoRecord(values);
        case "serviceAgreementTemplates":
            return createServiceAgreementTemplateRecord(values);
        case "maintenancePlans":
            return createMaintenancePlanRecord(values);
        case "maintenanceVisits":
            return createMaintenanceVisitRecord(values);
        case "automationRules":
            return createAutomationRuleRecord(values);
        case "aiRecommendations":
            return createAiRecommendationRecord(values);
        case "campaigns":
            return createCampaignRecord(values);
        case "campaignRecipients":
            return createCampaignRecipientRecord(values);
        case "messageLogs":
            return createMessageLogRecord(values);
        case "productCatalog":
            return createProductCatalogRecord(values);
        case "technicians":
            return createTechnicianRecord(values);
        case "jobTasks":
            return createJobTaskRecord(values);
        case "jobProducts":
            return createJobProductRecord(values);
        case "scheduleSlots":
            return createScheduleSlotRecord(values);
        case "activityEvents":
            return createActivityEventRecord(values);
    }
}
function createSelectChain(rows) {
    let filteredRows = [...rows];
    const chain = {
        where(predicate) {
            filteredRows = filteredRows.filter(predicate);
            return chain;
        },
        orderBy(definition) {
            return Promise.resolve(sortRows(filteredRows, definition));
        },
        limit(limitCount) {
            return Promise.resolve(filteredRows.slice(0, limitCount));
        },
        for(_lockStrength) {
            return chain;
        },
        then(onfulfilled, onrejected) {
            return Promise.resolve(filteredRows).then(onfulfilled, onrejected);
        }
    };
    return chain;
}
function createInsertChain(tableName) {
    return {
        values(values) {
            const records = (Array.isArray(values) ? values : [values]).map((value) => createRow(tableName, value));
            const targetRows = getRows(tableName);
            targetRows.push(...records);
            return {
                returning: () => Promise.resolve(records)
            };
        }
    };
}
function createUpdateChain(tableName) {
    return {
        set(values) {
            return {
                where(predicate) {
                    const rows = getRows(tableName).filter(predicate);
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
    and(...predicates) {
        return (row) => predicates.every((predicate) => predicate(row));
    },
    eq(field, value) {
        return (row) => row[field] === value;
    },
    isNull(field) {
        return (row) => row[field] === null;
    }
};
export const db = {
    select() {
        return {
            from(table) {
                return createSelectChain(getRows(table.__name));
            }
        };
    },
    insert(table) {
        return createInsertChain(table.__name);
    },
    update(table) {
        return createUpdateChain(table.__name);
    },
    async transaction(callback) {
        const snapshot = cloneState();
        try {
            return await callback(db);
        }
        catch (error) {
            restoreState(snapshot);
            throw error;
        }
    },
    query: {
        users: {
            async findFirst({ where }) {
                const predicate = where(usersTable, operators);
                return state.users.find((row) => predicate(row)) ?? null;
            }
        },
        companies: {
            async findFirst({ where }) {
                const predicate = where(companiesTable, operators);
                return state.companies.find((row) => predicate(row)) ?? null;
            }
        },
        importSessions: {
            async findFirst({ where }) {
                const predicate = where(importSessionsTable, operators);
                return state.importSessions.find((row) => predicate(row)) ?? null;
            }
        },
        automationRules: {
            async findFirst({ where }) {
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
export async function emitEvent(event) {
    state.activityEvents.push(createActivityEventRecord(event));
}
export async function emitEventWithExecutor(_executor, event) {
    state.activityEvents.push(createActivityEventRecord(event));
}
export async function markInvoiceOverdueIfNeeded(companyId, invoiceId) {
    const invoice = state.invoices.find((row) => row.companyId === companyId && row.id === invoiceId && row.deletedAt === null) ?? null;
    if (!invoice) {
        return null;
    }
    if (invoice.status !== "sent" || !invoice.dueAt || invoice.dueAt.getTime() > Date.now()) {
        return invoice;
    }
    invoice.status = "overdue";
    invoice.updatedAt = new Date();
    state.activityEvents.push(createActivityEventRecord({
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
    }));
    return invoice;
}
export const REVENUE_SUMMARY_CACHE_TTL_SECONDS = 300;
export function buildRevenueSummaryCacheKey(companyId) {
    return `revenue-summary:${companyId}`;
}
function toMoney(value) {
    return value.toFixed(2);
}
function isVisibleInRevenueDashboard(row, now) {
    if (row.deletedAt !== null || row.status !== "pending") {
        return false;
    }
    return row.snoozedUntil === null || row.snoozedUntil.getTime() <= now.getTime();
}
function buildTopRecommendations(rows) {
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
function sumEstimatedRevenue(rows) {
    return toMoney(rows.reduce((sum, row) => sum.add(new Decimal(row.estimatedRevenue ?? "0")), new Decimal(0)));
}
function sumEstimateTotals(rows) {
    return toMoney(rows.reduce((sum, row) => {
        const estimateTotal = row.estimateId !== null
            ? state.estimates.find((estimate) => estimate.id === row.estimateId)?.total ?? null
            : null;
        return sum.add(new Decimal(estimateTotal ?? row.estimatedRevenue ?? "0"));
    }, new Decimal(0)));
}
function sumInvoiceBalances(rows) {
    return toMoney(rows.reduce((sum, row) => {
        const invoiceBalance = row.invoiceId !== null
            ? state.invoices.find((invoice) => invoice.id === row.invoiceId)?.balanceDue ?? null
            : null;
        return sum.add(new Decimal(invoiceBalance ?? row.estimatedRevenue ?? "0"));
    }, new Decimal(0)));
}
export async function computeRevenueSummarySnapshot(companyId, now = new Date()) {
    const visibleRecommendations = state.aiRecommendations.filter((row) => row.companyId === companyId && isVisibleInRevenueDashboard(row, now));
    const dormantCustomers = visibleRecommendations.filter((row) => row.type === "reactivation");
    const unsoldEstimates = visibleRecommendations.filter((row) => row.type === "unsold_estimate");
    const unpaidInvoices = visibleRecommendations.filter((row) => row.type === "unpaid_invoice");
    const agingAssets = visibleRecommendations.filter((row) => row.type === "aging_asset");
    const maintenancePlanOpportunities = visibleRecommendations.filter((row) => row.type === "maintenance_plan_offer");
    const summary = {
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
    summary.totalOpportunityValue = toMoney(new Decimal(summary.dormantCustomers.estimatedRevenue)
        .add(summary.unsoldEstimates.totalValue)
        .add(summary.unpaidInvoices.totalValue)
        .add(summary.agingAssets.estimatedRevenue)
        .add(summary.maintenancePlanOpportunities.estimatedRevenue));
    return summary;
}
export async function listActiveCompanyIdsForRevenueSummary(since, offset, limit) {
    const activeCompanyIds = new Set(state.activityEvents
        .filter((row) => row.occurredAt.getTime() >= since.getTime())
        .map((row) => row.companyId));
    const orderedCompanyIds = state.companies
        .filter((row) => row.deletedAt === null && activeCompanyIds.has(row.id))
        .map((row) => row.id);
    return orderedCompanyIds.slice(offset, offset + limit);
}
export function createDrizzleModuleMock() {
    const sqlTag = (_strings, ..._values) => ({});
    return {
        and: (...predicates) => (row) => predicates.every((predicate) => predicate(row)),
        asc: (field) => ({
            direction: "asc",
            field: String(field)
        }),
        desc: (field) => ({
            direction: "desc",
            field: String(field)
        }),
        eq: (field, value) => (row) => row[field] === value,
        gt: (field, value) => (row) => row[field] > value,
        isNull: (field) => (row) => row[field] === null,
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
export function resetTestState() {
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
export function seedCompany(values) {
    const record = createCompanyRecord(values);
    state.companies.push(record);
    return record;
}
export function seedUser(values) {
    const record = createUserRecord(values);
    state.users.push(record);
    return record;
}
export function seedRefreshToken(values) {
    const record = createRefreshTokenRecord(values);
    state.refreshTokens.push(record);
    return record;
}
export function seedCustomer(values) {
    const record = createCustomerRecord(values);
    state.customers.push(record);
    return record;
}
export function seedProperty(values) {
    const record = createPropertyRecord(values);
    state.properties.push(record);
    return record;
}
export function seedAsset(values) {
    const record = createAssetRecord(values);
    state.assets.push(record);
    return record;
}
export function seedJob(values) {
    const record = createJobRecord(values);
    state.jobs.push(record);
    return record;
}
export function seedImportSession(values) {
    const record = createImportSessionRecord(values);
    state.importSessions.push(record);
    return record;
}
export function seedEstimate(values) {
    const record = createEstimateRecord(values);
    state.estimates.push(record);
    return record;
}
export function seedEstimateItem(values) {
    const record = createEstimateItemRecord(values);
    state.estimateItems.push(record);
    return record;
}
export function seedInvoice(values) {
    const record = createInvoiceRecord(values);
    state.invoices.push(record);
    return record;
}
export function seedInvoiceItem(values) {
    const record = createInvoiceItemRecord(values);
    state.invoiceItems.push(record);
    return record;
}
export function seedPayment(values) {
    const record = createPaymentRecord(values);
    state.payments.push(record);
    return record;
}
export function seedJobNote(values) {
    const record = createJobNoteRecord(values);
    state.jobNotes.push(record);
    return record;
}
export function seedJobPhoto(values) {
    const record = createJobPhotoRecord(values);
    state.jobPhotos.push(record);
    return record;
}
export function seedServiceAgreementTemplate(values) {
    const record = createServiceAgreementTemplateRecord(values);
    state.serviceAgreementTemplates.push(record);
    return record;
}
export function seedMaintenancePlan(values) {
    const record = createMaintenancePlanRecord(values);
    state.maintenancePlans.push(record);
    return record;
}
export function seedMaintenanceVisit(values) {
    const record = createMaintenanceVisitRecord(values);
    state.maintenanceVisits.push(record);
    return record;
}
export function seedAutomationRule(values) {
    const record = createAutomationRuleRecord(values);
    state.automationRules.push(record);
    return record;
}
export function seedAiRecommendation(values) {
    const record = createAiRecommendationRecord(values);
    state.aiRecommendations.push(record);
    return record;
}
export function seedCampaign(values) {
    const record = createCampaignRecord(values);
    state.campaigns.push(record);
    return record;
}
export function seedCampaignRecipient(values) {
    const record = createCampaignRecipientRecord(values);
    state.campaignRecipients.push(record);
    return record;
}
export function seedMessageLog(values) {
    const record = createMessageLogRecord(values);
    state.messageLogs.push(record);
    return record;
}
export function seedProductCatalog(values) {
    const record = createProductCatalogRecord(values);
    state.productCatalog.push(record);
    return record;
}
export function seedTechnician(values) {
    const record = createTechnicianRecord(values);
    state.technicians.push(record);
    return record;
}
export function seedJobTask(values) {
    const record = createJobTaskRecord(values);
    state.jobTasks.push(record);
    return record;
}
export function seedJobProduct(values) {
    const record = createJobProductRecord(values);
    state.jobProducts.push(record);
    return record;
}
export function seedScheduleSlot(values) {
    const record = createScheduleSlotRecord(values);
    state.scheduleSlots.push(record);
    return record;
}
export function seedActivityEvent(values) {
    const record = createActivityEventRecord(values);
    state.activityEvents.push(record);
    return record;
}
export function getTestState() {
    return state;
}
//# sourceMappingURL=fake-db.js.map