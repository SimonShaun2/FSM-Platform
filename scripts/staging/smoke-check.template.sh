#!/usr/bin/env bash
# FS-75 staging smoke template. Default: --dry-run (no HTTP). Live mode requires URLs + health routes.
set -euo pipefail

DRY_RUN=1
if [[ "${1:-}" == "--dry-run" ]]; then
  shift
elif [[ "${1:-}" == "--live" ]]; then
  DRY_RUN=0
  shift
fi

STAGING_API_URL="${STAGING_API_URL:-}"
STAGING_WEB_URL="${STAGING_WEB_URL:-}"
STAGING_WEBHOOK_URL="${STAGING_WEBHOOK_URL:-}"

checks=(
  "API liveness: GET \${STAGING_API_URL}/health"
  "API database: GET \${STAGING_API_URL}/health/db"
  "Web: GET \${STAGING_WEB_URL}/"
  "Webhook liveness: GET \${STAGING_WEBHOOK_URL}/health"
)

echo "FS-75 staging smoke checklist (tier=staging, non-live integrations)"
for line in "${checks[@]}"; do
  echo "  - ${line}"
done

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "Dry-run complete. Pass --live after FS-93 provision and health endpoints exist."
  exit 0
fi

for url_var in STAGING_API_URL STAGING_WEB_URL STAGING_WEBHOOK_URL; do
  if [[ -z "${!url_var}" ]]; then
    echo "Missing ${url_var} for --live mode" >&2
    exit 1
  fi
done

curl -fsS "${STAGING_API_URL}/health" >/dev/null
curl -fsS "${STAGING_API_URL}/health/db" >/dev/null
curl -fsS "${STAGING_WEB_URL}/" >/dev/null
curl -fsS "${STAGING_WEBHOOK_URL}/health" >/dev/null

echo "Live smoke checks passed."
