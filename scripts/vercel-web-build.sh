#!/usr/bin/env bash
# Vercel rootDirectory=apps/web — build workspace deps then Next (keeps vercel.json buildCommand under 256 chars).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
bash "$ROOT/scripts/vercel-web-build-deps.sh"
corepack pnpm --filter @fsm/web exec next build
