import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import { ErrorCode } from "@fsm/types";

import { setupTestEnv } from "../test-support/env-setup.js";

setupTestEnv();

const {
  addQueueJob,
  redisDelMock,
  redisGetMock,
  redisSetMock,
  resetRedisStore
} = vi.hoisted(() => {
  const store = new Map<string, string>();

  return {
    addQueueJob: vi.fn(),
    redisDelMock: vi.fn(async (key: string) => {
      const deleted = store.delete(key);
      return deleted ? 1 : 0;
    }),
    redisGetMock: vi.fn(async (key: string) => store.get(key) ?? null),
    redisSetMock: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
      return "OK";
    }),
    resetRedisStore: () => {
      store.clear();
    }
  };
});

vi.mock("drizzle-orm", async () => {
  const helper = await import("../test-support/fake-db.js");
  return helper.createDrizzleModuleMock();
});

vi.mock("@fsm/db", async () => {
  const helper = await import("../test-support/fake-db.js");
  return helper.createDbModuleMock();
});

vi.mock("@fsm/jobs", () => ({
  notificationsQueue: {
    add: addQueueJob
  },
  redisConnection: {
    get: redisGetMock,
    set: redisSetMock,
    del: redisDelMock
  }
}));

type BookingServiceModule = typeof import("./booking.service.js");
type DispatchServiceModule = typeof import("./dispatch.service.js");
type FakeDbModule = typeof import("../test-support/fake-db.js");
type ReviewRequestServiceModule = typeof import("./review-request.service.js");
type TimeTrackingServiceModule = typeof import("./time-tracking.service.js");

let bookingService: BookingServiceModule;
let dispatchService: DispatchServiceModule;
let fakeDb: FakeDbModule;
let reviewRequestService: ReviewRequestServiceModule;
let timeTrackingService: TimeTrackingServiceModule;

beforeAll(async () => {
  bookingService = await import("./booking.service.js");
  dispatchService = await import("./dispatch.service.js");
  fakeDb = await import("../test-support/fake-db.js");
  reviewRequestService = await import("./review-request.service.js");
  timeTrackingService = await import("./time-tracking.service.js");
});

beforeEach(() => {
  fakeDb.resetTestState();
  addQueueJob.mockReset();
  redisDelMock.mockClear();
  redisGetMock.mockClear();
  redisSetMock.mockClear();
  resetRedisStore();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-04-28T14:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

function createCompanyContext() {
  const company = fakeDb.seedCompany({
    name: "Acme HVAC",
    slug: "acme-hvac",
    timezone: "America/Chicago"
  });
  const actor = fakeDb.seedUser({
    companyId: company.id,
    email: "owner@example.com",
    firstName: "Ava",
    lastName: "Stone",
    role: "owner",
    phone: "555-9999"
  });

  return { company, actor };
}

function seedJobGraph(companyId: string) {
  const customer = fakeDb.seedCustomer({
    companyId,
    firstName: "Chris",
    lastName: "Pine",
    phone: "555-0100",
    email: "chris@example.com"
  });
  const property = fakeDb.seedProperty({
    companyId,
    customerId: customer.id,
    addressLine1: "101 Main St",
    city: "Tulsa",
    state: "OK",
    zip: "74103"
  });
  const technician = fakeDb.seedTechnician({
    companyId,
    firstName: "Taylor",
    lastName: "Tech",
    phone: "555-0101",
    serviceZipCodes: ["74103"],
    hoursPerDay: "8"
  });
  const technicianUser = fakeDb.seedUser({
    companyId,
    email: "tech@example.com",
    firstName: "Taylor",
    lastName: "Tech",
    role: "technician",
    technicianId: technician.id
  });
  const job = fakeDb.seedJob({
    companyId,
    customerId: customer.id,
    propertyId: property.id,
    technicianId: technician.id,
    title: "Spring Tune-Up",
    status: "scheduled",
    scheduledStart: new Date("2026-04-28T14:00:00.000Z"),
    scheduledEnd: new Date("2026-04-28T16:00:00.000Z")
  });

  return { customer, property, technician, technicianUser, job };
}

describe("phase2 operations services", () => {
  it("startTimeEntry and stopTimeEntry create a duration and emit events", async () => {
    const { company } = createCompanyContext();
    const { technicianUser, job } = seedJobGraph(company.id);

    const startedEntry = await timeTrackingService.startTimeEntry(company.id, technicianUser.id, job.id, {
      entryType: "on_site"
    });

    vi.setSystemTime(new Date("2026-04-28T14:30:00.000Z"));

    const stoppedEntry = await timeTrackingService.stopTimeEntry(company.id, technicianUser.id, job.id, {});
    const updatedJob = fakeDb.getTestState().jobs.find((item) => item.id === job.id);
    const eventTypes = fakeDb.getTestState().activityEvents.map((event) => event.eventType);

    expect(startedEntry.startedAt.toISOString()).toBe("2026-04-28T14:00:00.000Z");
    expect(stoppedEntry.durationMinutes).toBe(30);
    expect(updatedJob?.status).toBe("in_progress");
    expect(eventTypes).toContain("job.time_started");
    expect(eventTypes).toContain("job.time_stopped");
  });

  it("cannot start a second open time entry and OTW is limited to once per day", async () => {
    const { company } = createCompanyContext();
    const { job, technician, technicianUser } = seedJobGraph(company.id);

    await timeTrackingService.startTimeEntry(company.id, technicianUser.id, job.id, {
      entryType: "travel"
    });

    await expect(
      timeTrackingService.startTimeEntry(company.id, technicianUser.id, job.id, {
        entryType: "travel"
      })
    ).rejects.toMatchObject({
      code: ErrorCode.CONFLICT
    });

    await timeTrackingService.sendOnTheWayNotification(company.id, technicianUser.id, job.id, {
      technicianId: technician.id,
      estimatedArrivalMinutes: 20
    });

    expect(addQueueJob).toHaveBeenCalledWith(
      "send-otw-notification",
      expect.objectContaining({
        companyId: company.id,
        jobId: job.id,
        technicianId: technician.id,
        customerPhone: "555-0100"
      })
    );

    await expect(
      timeTrackingService.sendOnTheWayNotification(company.id, technicianUser.id, job.id, {
        technicianId: technician.id,
        estimatedArrivalMinutes: 15
      })
    ).rejects.toMatchObject({
      code: ErrorCode.CONFLICT
    });
  });

  it("review requests enqueue the SMS job and can be completed from the public token", async () => {
    const { company, actor } = createCompanyContext();
    const { job } = seedJobGraph(company.id);
    fakeDb.seedBookingSettings({
      companyId: company.id,
      bookingSlug: company.slug,
      isEnabled: true,
      googleReviewUrl: "https://google.example/review",
      yelpReviewUrl: "https://yelp.example/review",
      facebookReviewUrl: "https://facebook.example/review"
    });

    const reviewRequest = await reviewRequestService.createReviewRequest(company.id, actor.id, job.id, {
      channel: "sms"
    });
    const landing = await reviewRequestService.getPublicReviewLanding(reviewRequest.referenceId);
    const clickedRequest = fakeDb
      .getTestState()
      .reviewRequests.find((item) => item.id === reviewRequest.id);
    expect(landing.companyName).toBe("Acme HVAC");
    expect(landing.technicianName).toBe("Taylor Tech");
    expect(landing.status).toBe("clicked");
    expect(clickedRequest?.status).toBe("clicked");
    expect(clickedRequest?.clickedAt).not.toBeNull();
    const resentRequest = await reviewRequestService.resendReviewRequest(company.id, reviewRequest.id);
    const completed = await reviewRequestService.completePublicReviewRequest(reviewRequest.referenceId, {
      rating: 5,
      reviewText: "Great visit"
    });

    expect(reviewRequest.status).toBe("sent");
    expect(addQueueJob).toHaveBeenCalledWith(
      "send-review-request",
      expect.objectContaining({
        companyId: company.id,
        reviewRequestId: reviewRequest.id,
        referenceId: reviewRequest.referenceId
      })
    );
    expect(resentRequest.status).toBe("sent");
    expect(addQueueJob).toHaveBeenLastCalledWith(
      "send-review-request",
      expect.objectContaining({
        companyId: company.id,
        reviewRequestId: reviewRequest.id
      })
    );
    expect(completed.status).toBe("completed");
    expect(fakeDb.getTestState().activityEvents.at(-1)?.eventType).toBe("review_request.completed");
  });

  it("dispatch view computes gaps, utilization, and reuses the Redis cache", async () => {
    const { company } = createCompanyContext();
    const { customer, property, technician } = seedJobGraph(company.id);

    fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      propertyId: property.id,
      technicianId: technician.id,
      title: "Morning Repair",
      status: "scheduled",
      scheduledStart: new Date("2026-04-28T08:00:00.000Z"),
      scheduledEnd: new Date("2026-04-28T10:00:00.000Z")
    });
    fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      propertyId: property.id,
      technicianId: technician.id,
      title: "Afternoon Install",
      status: "scheduled",
      scheduledStart: new Date("2026-04-28T11:00:00.000Z"),
      scheduledEnd: new Date("2026-04-28T14:00:00.000Z")
    });

    const firstView = await dispatchService.getDispatchView(company.id, "2026-04-28");
    const secondView = await dispatchService.getDispatchView(company.id, "2026-04-28");

    expect(firstView.technicians).toHaveLength(1);
    expect(firstView.technicians[0]?.gaps[0]?.durationMinutes).toBe(60);
    expect(firstView.technicians[0]?.utilization).toBe(88);
    expect(redisSetMock).toHaveBeenCalledTimes(1);
    expect(secondView).toEqual(firstView);
  });

  it("checkZipCoverage and availability honor technician service zip codes and booked slots", async () => {
    const { company } = createCompanyContext();
    const { job, technician } = seedJobGraph(company.id);
    fakeDb.seedBookingSettings({
      companyId: company.id,
      bookingSlug: company.slug,
      isEnabled: true,
      availableHoursStart: 8,
      availableHoursEnd: 17,
      availableDays: ["tue"],
      allowZipOverflow: false
    });
    fakeDb.seedScheduleSlot({
      companyId: company.id,
      technicianId: technician.id,
      startTime: new Date("2026-04-28T08:00:00.000Z"),
      endTime: new Date("2026-04-28T12:00:00.000Z")
    });
    job.scheduledStart = new Date("2026-04-29T14:00:00.000Z");
    job.scheduledEnd = new Date("2026-04-29T16:00:00.000Z");

    const covered = await bookingService.checkZipCoverage(company.slug, "74103");
    const uncovered = await bookingService.checkZipCoverage(company.slug, "99999");
    const availability = await bookingService.getBookingAvailability(company.slug, "74103", "2026-04-28");

    expect(covered).toEqual({ covered: true, techCount: 1 });
    expect(uncovered).toEqual({ covered: false, techCount: 0 });
    expect(
      availability.some((window) => window.date === "2026-04-28" && window.window === "morning")
    ).toBe(false);
    expect(
      availability.some((window) => window.date === "2026-04-28" && window.window === "afternoon")
    ).toBe(true);
  });

  it("submitBookingRequest stores source and confirmBookingRequest creates the linked job", async () => {
    const { company, actor } = createCompanyContext();
    const { technician } = seedJobGraph(company.id);

    fakeDb.seedBookingSettings({
      companyId: company.id,
      bookingSlug: company.slug,
      isEnabled: true,
      autoConfirm: false,
      notifyOnNewBooking: true
    });

    const submitted = await bookingService.submitBookingRequest(
      company.slug,
      {
        firstName: "Jamie",
        lastName: "Stone",
        phone: "555-0200",
        email: "jamie@example.com",
        addressLine1: "500 Oak Ave",
        city: "Tulsa",
        state: "OK",
        zip: "74103",
        urgency: "this_week",
        preferredWindow: "afternoon",
        smsConsentAppointments: true
      },
      "google"
    );

    const confirmed = await bookingService.confirmBookingRequest(company.id, actor.id, submitted.bookingRequest.id, {
      technicianId: technician.id,
      scheduledStart: "2026-04-29T18:00:00.000Z",
      scheduledEnd: "2026-04-29T20:00:00.000Z"
    });

    expect(submitted.bookingRequest.source).toBe("google");
    expect(fakeDb.getTestState().bookingRequests).toHaveLength(1);
    expect(fakeDb.getTestState().jobs.some((job) => job.id === confirmed.jobId)).toBe(true);
    expect(addQueueJob).toHaveBeenCalledWith(
      "send-booking-confirmation",
      expect.objectContaining({
        companyId: company.id,
        bookingRequestId: submitted.bookingRequest.id
      })
    );
  });

  it("declineBookingRequest queues the decline SMS", async () => {
    const { company, actor } = createCompanyContext();

    fakeDb.seedBookingSettings({
      companyId: company.id,
      bookingSlug: company.slug,
      isEnabled: true
    });

    const bookingRequest = fakeDb.seedBookingRequest({
      companyId: company.id,
      firstName: "Jamie",
      lastName: "Stone",
      phone: "555-0200",
      email: "jamie@example.com",
      addressLine1: "500 Oak Ave",
      city: "Tulsa",
      state: "OK",
      zip: "74103",
      status: "pending",
      referenceNumber: "BK-20260428-0001"
    });

    const declined = await bookingService.declineBookingRequest(
      company.id,
      actor.id,
      bookingRequest.id,
      "No slots available"
    );

    expect(declined.status).toBe("cancelled");
    expect(addQueueJob).toHaveBeenCalledWith(
      "send-booking-decline",
      expect.objectContaining({
        companyId: company.id,
        bookingRequestId: bookingRequest.id
      })
    );
  });
});
