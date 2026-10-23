DO $$ BEGIN
 CREATE TYPE "public"."import_bundle_status" AS ENUM('active', 'committing', 'completed', 'abandoned');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE IF NOT EXISTS 'import.bundle.created';
--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE IF NOT EXISTS 'import.bundle.step_advanced';
--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE IF NOT EXISTS 'import.bundle.commit_started';
--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE IF NOT EXISTS 'import.bundle.completed';
--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE IF NOT EXISTS 'import.bundle.abandoned';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "import_bundles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"created_by_id" uuid,
	"status" "import_bundle_status" DEFAULT 'active' NOT NULL,
	"wizard_step" integer DEFAULT 1 NOT NULL,
	"step_state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dedupe_decisions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"completed_at" timestamp,
	"abandoned_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "import_sessions" ADD COLUMN IF NOT EXISTS "import_bundle_id" uuid;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "import_bundles" ADD CONSTRAINT "import_bundles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "import_bundles" ADD CONSTRAINT "import_bundles_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "import_sessions" ADD CONSTRAINT "import_sessions_import_bundle_id_import_bundles_id_fk" FOREIGN KEY ("import_bundle_id") REFERENCES "public"."import_bundles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "import_bundles_company_idx" ON "import_bundles" USING btree ("company_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "import_bundles_status_idx" ON "import_bundles" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "import_sessions_bundle_idx" ON "import_sessions" USING btree ("import_bundle_id");
