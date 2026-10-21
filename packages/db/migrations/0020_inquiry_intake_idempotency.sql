ALTER TYPE "public"."activity_event_type" ADD VALUE IF NOT EXISTS 'revenue.inquiry_received';
ALTER TYPE "public"."activity_event_type" ADD VALUE IF NOT EXISTS 'revenue.inquiry_escalated';

CREATE TABLE IF NOT EXISTS "inquiry_submit_idempotency" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"idempotency_key" varchar(128) NOT NULL,
	"payload_hash" varchar(64) NOT NULL,
	"booking_request_id" uuid NOT NULL,
	"response_snapshot" jsonb NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "inquiry_submit_idempotency" ADD CONSTRAINT "inquiry_submit_idempotency_booking_request_id_booking_requests_id_fk" FOREIGN KEY ("booking_request_id") REFERENCES "public"."booking_requests"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "inquiry_submit_idempotency_company_key_idx" ON "inquiry_submit_idempotency" USING btree ("company_id","idempotency_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inquiry_submit_idempotency_expires_idx" ON "inquiry_submit_idempotency" USING btree ("expires_at");
