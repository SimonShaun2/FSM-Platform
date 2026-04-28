CREATE TYPE "public"."automation_rule_type" AS ENUM('estimate_follow_up', 'estimate_declined', 'invoice_reminder', 'invoice_overdue', 'dormant_customer', 'maintenance_due', 'service_agreement_renewal', 'job_follow_up');--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'estimate.updated' BEFORE 'estimate.sent';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'estimate.deleted' BEFORE 'estimate.sent';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'estimate.converted' BEFORE 'estimate.revised';--> statement-breakpoint
ALTER TYPE "public"."estimate_status" ADD VALUE 'revised';--> statement-breakpoint
CREATE TABLE "automation_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"rule_type" "automation_rule_type" NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"delay_hours" integer,
	"threshold_days" integer,
	"config" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "automation_rules_company_idx" ON "automation_rules" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "automation_rules_rule_type_idx" ON "automation_rules" USING btree ("rule_type");--> statement-breakpoint
CREATE UNIQUE INDEX "automation_rules_company_rule_type_idx" ON "automation_rules" USING btree ("company_id","rule_type");