DO $$ BEGIN
 CREATE TYPE "public"."field_sync_batch_status" AS ENUM('open', 'completed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."field_sync_operation_outcome" AS ENUM('applied', 'duplicate', 'conflict', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "field_sync_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"device_id" varchar(128) NOT NULL,
	"batch_client_id" varchar(128) NOT NULL,
	"status" "field_sync_batch_status" DEFAULT 'open' NOT NULL,
	"last_acknowledged_sequence" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "field_sync_operations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"client_operation_id" varchar(128) NOT NULL,
	"job_id" uuid NOT NULL,
	"operation_type" varchar(64) NOT NULL,
	"request_payload" jsonb NOT NULL,
	"outcome" "field_sync_operation_outcome" NOT NULL,
	"result_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"payload_hash" varchar(128) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "field_sync_batches" ADD CONSTRAINT "field_sync_batches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "field_sync_operations" ADD CONSTRAINT "field_sync_operations_batch_id_field_sync_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."field_sync_batches"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "field_sync_operations" ADD CONSTRAINT "field_sync_operations_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "field_sync_batches_device_client_idx" ON "field_sync_batches" USING btree ("company_id","device_id","batch_client_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "field_sync_batches_company_user_idx" ON "field_sync_batches" USING btree ("company_id","user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "field_sync_operations_company_client_op_idx" ON "field_sync_operations" USING btree ("company_id","client_operation_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "field_sync_operations_batch_sequence_idx" ON "field_sync_operations" USING btree ("batch_id","sequence");
