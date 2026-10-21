#!/usr/bin/env bash
# QA smoke helper: branded storefront → public booking (FS-58 / FS-21 path).
# Prereqs: migrated Postgres, `pnpm dev` (API :3001, web :3000), tenant with booking enabled.
set -euo pipefail

BOOKING_SLUG="${BOOKING_SLUG:-}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:3001}"

if [[ -z "${BOOKING_SLUG}" ]]; then
  echo "Set BOOKING_SLUG to the company's public booking slug (booking_settings.booking_slug or companies.slug)." >&2
  echo "Example: BOOKING_SLUG=acme-hvac $0" >&2
  exit 1
fi

STOREFRONT="${WEB_URL}/site/${BOOKING_SLUG}"
BOOKING="${WEB_URL}/book/${BOOKING_SLUG}?src=website"

echo "Branded storefront: ${STOREFRONT}"
echo "Public booking:     ${BOOKING}"
echo ""
echo "Checking public booking settings API..."

if curl -fsS "${API_URL}/api/v1/public/booking/${BOOKING_SLUG}" >/dev/null; then
  echo "OK: GET /api/v1/public/booking/${BOOKING_SLUG}"
else
  echo "FAIL: booking settings not available (is booking enabled for this slug?)" >&2
  exit 1
fi

echo ""
echo "Open the storefront URL in a browser and use Book a clean / Book this time to reach the booking flow."
