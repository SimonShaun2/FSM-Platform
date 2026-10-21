import { publicEnv } from "@fsm/config";

import type { PublicBookingSettingsRecord } from "@/src/hooks/booking.hooks";

interface PublicBookingResponse {
  booking: PublicBookingSettingsRecord;
}

export async function fetchPublicBookingSettingsBySlug(
  slug: string
): Promise<PublicBookingSettingsRecord | null> {
  const base = publicEnv.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  const response = await fetch(`${base}/api/v1/public/booking/${encodeURIComponent(slug)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    next: { revalidate: 60 }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Public booking settings request failed (${response.status})`);
  }

  const payload = (await response.json()) as PublicBookingResponse;
  return payload.booking;
}
