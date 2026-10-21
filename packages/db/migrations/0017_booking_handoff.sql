CREATE TYPE "public"."booking_handoff_status" AS ENUM('pending_external', 'succeeded', 'failed');--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'booking.handoff_initiated';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'booking.handoff_reconciled';--> statement-breakpoint
CREATE TABLE "booking_handoffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"booking_request_id" uuid NOT NULL,
	"target_system" varchar(100) NOT NULL,
	"status" "booking_handoff_status" DEFAULT 'pending_external' NOT NULL,
	"external_reference" varchar(255),
	"failure_reason" text,
	"operator_notes" text,
	"initiated_by_id" uuid NOT NULL,
	"reconciled_by_id" uuid,
	"reconciled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "booking_handoffs" ADD CONSTRAINT "booking_handoffs_booking_request_id_booking_requests_id_fk" FOREIGN KEY ("booking_request_id") REFERENCES "public"."booking_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_handoffs_company_idx" ON "booking_handoffs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "booking_handoffs_booking_request_idx" ON "booking_handoffs" USING btree ("booking_request_id");--> statement-breakpoint
CREATE INDEX "booking_handoffs_status_idx" ON "booking_handoffs" USING btree ("status");
