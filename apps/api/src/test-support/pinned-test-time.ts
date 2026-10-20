import { afterEach, beforeEach, vi } from "vitest";

/** Aligns calendar-sensitive fixtures with phase2-operations suites (April 2026). */
export const PINNED_TEST_SYSTEM_TIME = new Date("2026-04-28T14:00:00.000Z");

export function pinTestSystemTime(): void {
  vi.useFakeTimers();
  vi.setSystemTime(PINNED_TEST_SYSTEM_TIME);
}

export function restoreTestSystemTime(): void {
  vi.useRealTimers();
}

/** Register beforeEach/afterEach hooks that pin Vitest's system clock for the suite. */
export function usePinnedTestSystemTime(): void {
  beforeEach(() => {
    pinTestSystemTime();
  });

  afterEach(() => {
    restoreTestSystemTime();
  });
}
