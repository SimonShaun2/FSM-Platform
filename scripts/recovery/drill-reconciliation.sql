-- FS-83 isolated drill reconciliation queries (read-only)
-- Run only against an isolated drill database. Do not run against production.
-- Pair with: docs/infrastructure/FS-83-drill-reconciliation-checklist.md

-- ─── Tenant separation ─────────────────────────────────────────────

-- Q-tenant-null-company: core SoR tables must have company_id
SELECT 'customers' AS table_name, COUNT(*) AS bad_rows
FROM customers WHERE company_id IS NULL
UNION ALL
SELECT 'jobs', COUNT(*) FROM jobs WHERE company_id IS NULL
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices WHERE company_id IS NULL
UNION ALL
SELECT 'payments', COUNT(*) FROM payments WHERE company_id IS NULL
UNION ALL
SELECT 'activity_events', COUNT(*) FROM activity_events WHERE company_id IS NULL;

-- Q-tenant-job-customer: job.customer must belong to same company
SELECT j.id AS job_id, j.company_id AS job_company, c.company_id AS customer_company
FROM jobs j
INNER JOIN customers c ON c.id = j.customer_id
WHERE j.company_id <> c.company_id
  AND j.deleted_at IS NULL
  AND c.deleted_at IS NULL
LIMIT 50;

-- Q-tenant-invoice-customer
SELECT i.id AS invoice_id, i.company_id AS invoice_company, c.company_id AS customer_company
FROM invoices i
INNER JOIN customers c ON c.id = i.customer_id
WHERE i.company_id <> c.company_id
  AND i.deleted_at IS NULL
  AND c.deleted_at IS NULL
LIMIT 50;

-- Q-tenant-file-entity: file_attachments company vs linked customer when present
SELECT fa.id, fa.company_id AS file_company, c.company_id AS customer_company
FROM file_attachments fa
LEFT JOIN customers c ON c.id = fa.customer_id
WHERE fa.customer_id IS NOT NULL
  AND c.id IS NOT NULL
  AND fa.company_id <> c.company_id
LIMIT 50;

-- ─── Referential / integrity samples ───────────────────────────────

-- Q-payment-duplicate-stripe-intent
SELECT company_id, stripe_payment_intent_id, COUNT(*) AS cnt
FROM payments
WHERE stripe_payment_intent_id IS NOT NULL
GROUP BY company_id, stripe_payment_intent_id
HAVING COUNT(*) > 1;

-- Q-payment-negative-amount
SELECT id, company_id, amount
FROM payments
WHERE amount::numeric < 0
LIMIT 50;

-- Q-invoice-payment-balance (sample drift; review manually)
SELECT i.id AS invoice_id,
       i.company_id,
       i.total::numeric AS invoice_total,
       COALESCE(SUM(p.amount::numeric), 0) AS paid_sum,
       i.total::numeric - COALESCE(SUM(p.amount::numeric), 0) AS delta
FROM invoices i
LEFT JOIN payments p ON p.invoice_id = i.id AND p.status = 'completed'
WHERE i.deleted_at IS NULL
GROUP BY i.id, i.company_id, i.total
HAVING ABS(i.total::numeric - COALESCE(SUM(p.amount::numeric), 0)) > 0.01
LIMIT 50;

-- Q-ref-import-session-company (import_sessions should be single-tenant per id)
SELECT import_session_id, COUNT(DISTINCT company_id) AS company_count
FROM customers
WHERE import_session_id IS NOT NULL
GROUP BY import_session_id
HAVING COUNT(DISTINCT company_id) > 1;

-- ─── Activity stream sanity ────────────────────────────────────────

SELECT MAX(occurred_at) AS latest_event,
       MIN(occurred_at) AS earliest_event,
       COUNT(*) AS total_events
FROM activity_events;

SELECT COUNT(*) AS empty_summaries
FROM activity_events
WHERE summary IS NULL OR btrim(summary) = '';
