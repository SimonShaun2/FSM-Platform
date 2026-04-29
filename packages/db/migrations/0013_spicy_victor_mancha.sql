CREATE TYPE "public"."job_task_status" AS ENUM('pending', 'in_progress', 'completed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."product_category" AS ENUM('service', 'labor', 'material', 'equipment', 'fee', 'bundle');--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'job.task_completed' BEFORE 'estimate.created';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'job.product_added' BEFORE 'estimate.created';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'job.product_removed' BEFORE 'estimate.created';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'job.upsell_approved' BEFORE 'estimate.created';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'product.created' BEFORE 'technician.created';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'product.updated' BEFORE 'technician.created';--> statement-breakpoint
CREATE TABLE "job_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"product_catalog_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" "product_category" DEFAULT 'service' NOT NULL,
	"quantity" numeric(10, 3) DEFAULT '1' NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"is_taxable" boolean DEFAULT true,
	"added_by_id" uuid,
	"is_upsell" boolean DEFAULT false,
	"upsell_approved" boolean DEFAULT false,
	"upsell_approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "job_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"assigned_to_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "job_task_status" DEFAULT 'pending' NOT NULL,
	"is_required" boolean DEFAULT false,
	"completed_at" timestamp,
	"completed_by_id" uuid,
	"estimated_minutes" integer,
	"actual_minutes" integer,
	"sort_order" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "product_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" "product_category" DEFAULT 'service' NOT NULL,
	"sku" varchar(100),
	"unit_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"cost" numeric(10, 2),
	"unit" varchar(50) DEFAULT 'each',
	"is_taxable" boolean DEFAULT true,
	"is_active" boolean DEFAULT true NOT NULL,
	"applicable_asset_types" text[] DEFAULT '{}',
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "technicians" ADD COLUMN "service_zip_codes" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "job_products" ADD CONSTRAINT "job_products_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_products" ADD CONSTRAINT "job_products_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_products" ADD CONSTRAINT "job_products_product_catalog_id_product_catalog_id_fk" FOREIGN KEY ("product_catalog_id") REFERENCES "public"."product_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_products" ADD CONSTRAINT "job_products_added_by_id_users_id_fk" FOREIGN KEY ("added_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_tasks" ADD CONSTRAINT "job_tasks_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_tasks" ADD CONSTRAINT "job_tasks_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_tasks" ADD CONSTRAINT "job_tasks_assigned_to_id_technicians_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."technicians"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_tasks" ADD CONSTRAINT "job_tasks_completed_by_id_users_id_fk" FOREIGN KEY ("completed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_catalog" ADD CONSTRAINT "product_catalog_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_products_company_idx" ON "job_products" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "job_products_job_idx" ON "job_products" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_tasks_company_idx" ON "job_tasks" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "job_tasks_job_idx" ON "job_tasks" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_tasks_status_idx" ON "job_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "product_catalog_company_idx" ON "product_catalog" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "product_catalog_active_idx" ON "product_catalog" USING btree ("is_active");