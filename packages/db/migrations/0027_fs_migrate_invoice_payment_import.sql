ALTER TYPE "public"."import_entity_type" ADD VALUE IF NOT EXISTS 'payments';--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "source_system" varchar(64);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "source_id" varchar(256);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "import_session_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "source_system" varchar(64);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "source_id" varchar(256);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "import_session_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_import_session_id_import_sessions_id_fk" FOREIGN KEY ("import_session_id") REFERENCES "public"."import_sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_import_session_id_import_sessions_id_fk" FOREIGN KEY ("import_session_id") REFERENCES "public"."import_sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_import_lineage_idx" ON "invoices" USING btree ("company_id","source_system","source_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payments_import_lineage_idx" ON "payments" USING btree ("company_id","source_system","source_id");
