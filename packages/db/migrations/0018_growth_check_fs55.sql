CREATE TYPE "public"."growth_check_scan_status" AS ENUM('queued', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."growth_check_finding_status" AS ENUM('pass', 'fail', 'warning', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."growth_check_finding_confidence" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TABLE "growth_check_scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"requested_by_user_id" uuid,
	"target_url" text NOT NULL,
	"rubric_id" varchar(64) NOT NULL,
	"rubric_version" varchar(32) NOT NULL,
	"status" "growth_check_scan_status" DEFAULT 'queued' NOT NULL,
	"progress" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"idempotency_key" varchar(128) NOT NULL,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);--> statement-breakpoint
CREATE TABLE "growth_check_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"scan_id" uuid NOT NULL,
	"area_id" varchar(64) NOT NULL,
	"check_id" varchar(64) NOT NULL,
	"source_url" text NOT NULL,
	"observed_at" timestamp NOT NULL,
	"status" "growth_check_finding_status" NOT NULL,
	"confidence" "growth_check_finding_confidence" NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);--> statement-breakpoint
ALTER TABLE "growth_check_scans" ADD CONSTRAINT "growth_check_scans_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "growth_check_scans" ADD CONSTRAINT "growth_check_scans_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "growth_check_findings" ADD CONSTRAINT "growth_check_findings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "growth_check_findings" ADD CONSTRAINT "growth_check_findings_scan_id_growth_check_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."growth_check_scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "growth_check_scans_company_idx" ON "growth_check_scans" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "growth_check_scans_company_idempotency_idx" ON "growth_check_scans" USING btree ("company_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "growth_check_findings_company_idx" ON "growth_check_findings" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "growth_check_findings_scan_idx" ON "growth_check_findings" USING btree ("scan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "growth_check_findings_scan_check_idx" ON "growth_check_findings" USING btree ("scan_id","check_id");
