DO $$ BEGIN
 CREATE TYPE "public"."data_export_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'expired');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."data_export_format" AS ENUM('json', 'csv_bundle');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE IF NOT EXISTS 'export.requested';
--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE IF NOT EXISTS 'export.completed';
--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE IF NOT EXISTS 'export.failed';
--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE IF NOT EXISTS 'export.downloaded';
--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE IF NOT EXISTS 'export.expired';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_export_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"requested_by_id" uuid,
	"status" "data_export_status" DEFAULT 'pending' NOT NULL,
	"format" "data_export_format" DEFAULT 'json' NOT NULL,
	"manifest_version" varchar(64) DEFAULT 'fsm.data-export.v1' NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"file_name" varchar(255),
	"file_url" text,
	"record_counts" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"expires_at" timestamp,
	"completed_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "data_export_sessions_company_idx" ON "data_export_sessions" USING btree ("company_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "data_export_sessions_status_idx" ON "data_export_sessions" USING btree ("status");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_export_sessions" ADD CONSTRAINT "data_export_sessions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_export_sessions" ADD CONSTRAINT "data_export_sessions_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
