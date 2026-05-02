# TICKET-014a: Product Catalog API

**Phase:** 2A
**Assigned:** Agent 1 (Backend Architect)
**Auditor:** Agent 4 (QA & Standards)
**Priority:** P0 — Required for job tasks, job products, and estimate line items
**Dependencies:** TICKET-013 APPROVED (runs parallel with TICKET-014)

---

## Agent Prompts

### Agent 1 — Read This First
You are Agent 1 (Backend Architect). This ticket implements the Product
Catalog API — the company's price list of services, labor, and materials.
Products are used when adding line items to estimates, invoices, and jobs.
The catalog also feeds AI upsell suggestions via applicableAssetTypes.
Follow all rules in AGENTS.md, CODEX.md, WORKFLOW.md. No stubs.
Tests required. Commit and push to GitHub when done.
Output TASK COMPLETE when done.

---

## Figma Reference

**Not applicable for backend tickets.**
The product catalog UI is designed in Figma page: 📦 Product Catalog
Agent 1 builds the API that Agent 2 will consume.

---

## Objective

Implement the product catalog CRUD API. When complete, companies can
manage their service items, labor rates, and materials. The catalog
feeds estimate line item pickers, job product panels, and AI upsell
logic.

---

## Acceptance Criteria

- [ ] `GET /api/v1/products` — paginated list with search + filters
- [ ] `POST /api/v1/products` — create catalog item
- [ ] `GET /api/v1/products/:id` — single item detail
- [ ] `PATCH /api/v1/products/:id` — update item
- [ ] `DELETE /api/v1/products/:id` — soft delete
- [ ] `GET /api/v1/products/search` — fast search for picker dropdowns
- [ ] All routes require `authenticate` preHandler
- [ ] Write routes require `requireRole(['owner', 'admin'])`
- [ ] Unit tests for all service functions
- [ ] Integration tests for all routes
- [ ] `pnpm build` passes clean

---

## Agent 1 Owns

### 1. Product Catalog service
**File:** `/apps/api/src/services/product-catalog.service.ts`

```typescript
listProducts(companyId: string, query: ListProductsQuery): Promise<PaginatedResult<Product>>
```
- Filters: `category`, `isActive` (default true), `search` (name/sku)
- Sort: `sortOrder` asc, then `name` asc
- Pagination: page, limit (default 50)

```typescript
searchProducts(companyId: string, q: string): Promise<Product[]>
```
- Fast search for picker dropdowns — returns max 20 results
- Matches on name or SKU, active only
- Used by estimate builder and job product picker

```typescript
getProduct(companyId: string, productId: string): Promise<Product>
```

```typescript
createProduct(companyId: string, actorId: string, input: CreateProductInput): Promise<Product>
```
- Validates SKU uniqueness within company
- Emits `product.created`

```typescript
updateProduct(companyId: string, actorId: string, productId: string, input: UpdateProductInput): Promise<Product>
```
- Emits `product.updated`

```typescript
deleteProduct(companyId: string, actorId: string, productId: string): Promise<void>
```
- Soft delete (sets deletedAt)
- Throws CONFLICT if product is used on active jobs

### 2. Job Tasks + Products service
**File:** `/apps/api/src/services/job-tasks.service.ts`

```typescript
listTasks(companyId: string, jobId: string): Promise<JobTask[]>
createTask(companyId: string, jobId: string, input: CreateTaskInput): Promise<JobTask>
updateTask(companyId: string, jobId: string, taskId: string, input: UpdateTaskInput): Promise<JobTask>
completeTask(companyId: string, jobId: string, taskId: string, actorId: string): Promise<JobTask>
deleteTask(companyId: string, jobId: string, taskId: string): Promise<void>
reorderTasks(companyId: string, jobId: string, orderedIds: string[]): Promise<void>
```

**File:** `/apps/api/src/services/job-products.service.ts`

```typescript
listJobProducts(companyId: string, jobId: string): Promise<JobProduct[]>
addProduct(companyId: string, jobId: string, actorId: string, input: AddJobProductInput): Promise<JobProduct>
updateJobProduct(companyId: string, jobId: string, productId: string, input: UpdateJobProductInput): Promise<JobProduct>
removeJobProduct(companyId: string, jobId: string, productId: string): Promise<void>
approveUpsell(companyId: string, jobId: string, productId: string, actorId: string): Promise<JobProduct>
```

- `addProduct`: if `productCatalogId` provided, snapshots name/price from catalog
- `approveUpsell`: sets `upsellApproved = true`, emits `job.upsell_approved`
- All mutations emit `job.product_added` / `job.product_removed`

### 3. Routes

```
GET    /api/v1/products              listProducts
POST   /api/v1/products              createProduct
GET    /api/v1/products/search       searchProducts (query param: q)
GET    /api/v1/products/:id          getProduct
PATCH  /api/v1/products/:id          updateProduct
DELETE /api/v1/products/:id          deleteProduct

GET    /api/v1/jobs/:id/tasks        listTasks
POST   /api/v1/jobs/:id/tasks        createTask
PATCH  /api/v1/jobs/:id/tasks/:taskId  updateTask
POST   /api/v1/jobs/:id/tasks/:taskId/complete  completeTask
DELETE /api/v1/jobs/:id/tasks/:taskId  deleteTask
POST   /api/v1/jobs/:id/tasks/reorder  reorderTasks

GET    /api/v1/jobs/:id/products     listJobProducts
POST   /api/v1/jobs/:id/products     addProduct
PATCH  /api/v1/jobs/:id/products/:productId  updateJobProduct
DELETE /api/v1/jobs/:id/products/:productId  removeJobProduct
POST   /api/v1/jobs/:id/products/:productId/approve-upsell  approveUpsell
```

### 4. Schema migration
Generate migration for:
- `product_catalog` table (already in schema)
- `job_tasks` table (already in schema)
- `job_products` table (already in schema)
- `technicians.serviceZipCodes` column (already in schema)

Run `pnpm --filter @fsm/db db:generate`

### 5. Tests
Unit + integration tests following standard patterns.
Include: search returns max 20, upsell approval emits event,
snapshot preserves price when catalog item changes.

---

## Agent 4 Audit Checklist

- [ ] `pnpm build` passes clean
- [ ] No `any` types
- [ ] No `process.env` outside `@fsm/config`
- [ ] All routes require `authenticate`
- [ ] Product write routes require `requireRole(['owner', 'admin'])`
- [ ] `searchProducts` returns max 20, active only
- [ ] `addProduct` snapshots price from catalog at time of add
- [ ] `approveUpsell` emits `job.upsell_approved`
- [ ] `deleteProduct` throws CONFLICT if on active jobs
- [ ] Migration generated
- [ ] Unit + integration tests present

---

## Notes

- Add `product.types.ts`, `job-task.types.ts`, `job-product.types.ts` to `@fsm/types`
- Activity events: `product.created`, `product.updated`, `job.task_completed`,
  `job.product_added`, `job.product_removed`, `job.upsell_approved`
- Git commit: "TICKET-014a: Product Catalog + Job Tasks/Products API"
