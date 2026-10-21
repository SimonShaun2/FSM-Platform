DO $$ BEGIN
 CREATE TYPE "public"."growth_intake_check_status" AS ENUM('intake_draft', 'queued', 'scanning', 'review_needed', 'completed', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."growth_intake_identity_source" AS ENUM('manual', 'website', 'google_business', 'facebook', 'import', 'ai');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."growth_intake_finding_severity" AS ENUM('info', 'low', 'medium', 'high', 'critical');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."growth_intake_finding_status" AS ENUM('open', 'acknowledged', 'resolved', 'dismissed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."growth_intake_audit_entity_type" AS ENUM('growth_intake_check', 'growth_intake_identity_candidate', 'growth_intake_finding');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."growth_intake_audit_action" AS ENUM('created', 'updated', 'deleted');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "growth_intake_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"status" "growth_intake_check_status" DEFAULT 'queued' NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"created_by_id" uuid NOT NULL,
	"review_needed" boolean DEFAULT false NOT NULL,
	"last_scan_at" timestamp,
	"business_name" varchar(255) NOT NULL,
	"website_url" varchar(500),
	"industry" varchar(120),
	"trade" varchar(120),
	"city" varchar(100),
	"state" varchar(50),
	"zip" varchar(20),
	"contact_name" varchar(255),
	"contact_email" varchar(255),
	"contact_phone" varchar(30),
	"target_market" text,
	"google_business_profile_url" varchar(500),
	"facebook_page_url" varchar(500),
	"intake_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "growth_intake_identity_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"growth_intake_check_id" uuid NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"domain" varchar(255),
	"source" "growth_intake_identity_source" DEFAULT 'manual' NOT NULL,
	"confidence_score" numeric(5, 4),
	"is_primary" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "growth_intake_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"growth_intake_check_id" uuid NOT NULL,
	"category" varchar(100) NOT NULL,
	"severity" "growth_intake_finding_severity" DEFAULT 'info' NOT NULL,
	"status" "growth_intake_finding_status" DEFAULT 'open' NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"recommendation" text,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "growth_intake_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"entity_type" "growth_intake_audit_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"growth_intake_check_id" uuid,
	"action" "growth_intake_audit_action" NOT NULL,
	"actor_id" uuid,
	"before_state" jsonb,
	"after_state" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "growth_intake_checks" ADD CONSTRAINT "growth_intake_checks_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "growth_intake_checks" ADD CONSTRAINT "growth_intake_checks_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "growth_intake_checks" ADD CONSTRAINT "growth_intake_checks_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "growth_intake_identity_candidates" ADD CONSTRAINT "growth_intake_identity_candidates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "growth_intake_identity_candidates" ADD CONSTRAINT "growth_intake_identity_candidates_growth_intake_check_id_fk" FOREIGN KEY ("growth_intake_check_id") REFERENCES "public"."growth_intake_checks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "growth_intake_findings" ADD CONSTRAINT "growth_intake_findings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "growth_intake_findings" ADD CONSTRAINT "growth_intake_findings_growth_intake_check_id_fk" FOREIGN KEY ("growth_intake_check_id") REFERENCES "public"."growth_intake_checks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "growth_intake_audit_events" ADD CONSTRAINT "growth_intake_audit_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "growth_intake_audit_events" ADD CONSTRAINT "growth_intake_audit_events_growth_intake_check_id_fk" FOREIGN KEY ("growth_intake_check_id") REFERENCES "public"."growth_intake_checks"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "growth_intake_audit_events" ADD CONSTRAINT "growth_intake_audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "growth_intake_checks_company_status_idx" ON "growth_intake_checks" USING btree ("company_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "growth_intake_checks_company_owner_idx" ON "growth_intake_checks" USING btree ("company_id","owner_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "growth_intake_checks_company_review_idx" ON "growth_intake_checks" USING btree ("company_id","review_needed");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "growth_intake_identity_candidates_check_idx" ON "growth_intake_identity_candidates" USING btree ("growth_intake_check_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "growth_intake_identity_candidates_company_check_idx" ON "growth_intake_identity_candidates" USING btree ("company_id","growth_intake_check_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "growth_intake_findings_check_idx" ON "growth_intake_findings" USING btree ("growth_intake_check_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "growth_intake_findings_company_check_idx" ON "growth_intake_findings" USING btree ("company_id","growth_intake_check_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "growth_intake_audit_events_company_entity_idx" ON "growth_intake_audit_events" USING btree ("company_id","entity_type","entity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "growth_intake_audit_events_company_check_idx" ON "growth_intake_audit_events" USING btree ("company_id","growth_intake_check_id");
