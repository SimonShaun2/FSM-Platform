ALTER TYPE "public"."activity_event_type" ADD VALUE 'import.started';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'import.completed';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'import.rolled_back';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'import.failed';--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "import_session_id" uuid;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "import_session_id" uuid;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "import_session_id" uuid;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "import_session_id" uuid;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_import_session_id_import_sessions_id_fk" FOREIGN KEY ("import_session_id") REFERENCES "public"."import_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_import_session_id_import_sessions_id_fk" FOREIGN KEY ("import_session_id") REFERENCES "public"."import_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_import_session_id_import_sessions_id_fk" FOREIGN KEY ("import_session_id") REFERENCES "public"."import_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_import_session_id_import_sessions_id_fk" FOREIGN KEY ("import_session_id") REFERENCES "public"."import_sessions"("id") ON DELETE no action ON UPDATE no action;