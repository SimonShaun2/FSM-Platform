# FS-31 Batch 4 — Branded acquisition MVP spec

**Batch:** `BATCH-FS4-GROWTH-003`  
**Base SHA:** `7f1e6328e1a5ba54c7477b0cce0496502235f1e0`  
**Notion:** [Branded acquisition MVP](https://app.notion.com/p/3ff317b92d1581ce81c4fcbcc16e9938)

## Acceptance mapping

| AC area | Implementation |
|---------|----------------|
| Customer journey | `/site/{slug}` → book **or** `/site/{slug}/inquire` → submit → reference |
| Page / content | `BrandedStorefront` + service cards, areas, coexistence copy |
| Local SEO | `generateMetadata` (OG, keywords, robots), `LocalBusiness` JSON-LD, service area text |
| Accessibility | Existing `BrandedStorefrontNav` focus trap + form labels on inquiry page |
| Consent | Appointment SMS required; marketing SMS optional (defaults off) |
| Source attribution | `src=website` on book/inquire links |
| Inquiry data contract | `docs/contracts/fs-31-branded-acquisition-inquiry.v1.md` |
| FS-17/18 handoff | Submit → `booking_requests`; operator path via revenue-inquiries API |
| Measurement | Documented mapping to `job-source-reporting` `own_website` + FS-35 cost rubric (manual) |
| FS-35 validation | Direct-job proof uses same channel rollup as growth thesis — no phantom bookings |

## QA (local)

```bash
BOOKING_SLUG=<slug> ./scripts/qa-branded-site-local.sh
# Then open /site/<slug> and /site/<slug>/inquire
```

## Tests

- `pnpm --filter @fsm/web test` (storefront + nav a11y utils)
- `pnpm --filter @fsm/web lint`
