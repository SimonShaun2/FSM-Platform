CREATE TYPE "public"."attachment_entity_type" AS ENUM('job', 'customer', 'property', 'asset', 'estimate', 'invoice', 'work_order');--> statement-breakpoint
CREATE TYPE "public"."booking_request_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."booking_source" AS ENUM('google', 'facebook', 'instagram', 'yelp', 'direct', 'website', 'qr_code');--> statement-breakpoint
CREATE TYPE "public"."review_request_status" AS ENUM('pending', 'sent', 'clicked', 'completed', 'declined');--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'job.time_started' BEFORE 'job.task_completed';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'job.time_stopped' BEFORE 'job.task_completed';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'technician.on_the_way' BEFORE 'service_agreement_template.created';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'review_request.sent' BEFORE 'message.sent';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'review_request.completed' BEFORE 'message.sent';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'booking.requested';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'booking.confirmed';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'booking.cancelled';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'booking.completed';--> statement-breakpoint
ALTER TYPE "public"."automation_rule_type" ADD VALUE 'review_request';--> statement-breakpoint
CREATE TABLE "booking_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"customer_id" uuid,
	"job_id" uuid,
	"assigned_technician_id" uuid,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"email" varchar(255),
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(100),
	"city" varchar(100) NOT NULL,
	"state" varchar(50) NOT NULL,
	"zip" varchar(20) NOT NULL,
	"property_type" varchar(30) DEFAULT 'residential',
	"service_category" varchar(100),
	"service_type" varchar(100),
	"service_detail" varchar(255),
	"urgency" varchar(30) DEFAULT 'this_week',
	"customer_notes" text,
	"preferred_date" date,
	"preferred_window" varchar(50),
	"status" "booking_request_status" DEFAULT 'pending' NOT NULL,
	"source" "booking_source" DEFAULT 'direct' NOT NULL,
	"reference_number" varchar(50),
	"is_property_owner" boolean DEFAULT false,
	"sms_consent_appointments" boolean DEFAULT false,
	"sms_consent_marketing" boolean DEFAULT false,
	"confirmed_at" timestamp,
	"confirmed_by_id" uuid,
	"confirmation_sms_sent_at" timestamp,
	"cancelled_at" timestamp,
	"cancellation_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "booking_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"booking_slug" varchar(100),
	"offered_services" jsonb DEFAULT '[]'::jsonb,
	"available_hours_start" integer DEFAULT 8,
	"available_hours_end" integer DEFAULT 17,
	"available_days" text[] DEFAULT '{"mon","tue","wed","thu","fri"}',
	"slot_duration" integer DEFAULT 2,
	"max_advance_days" integer DEFAULT 14,
	"auto_confirm" boolean DEFAULT false,
	"google_review_url" text,
	"yelp_review_url" text,
	"facebook_review_url" text,
	"allow_zip_overflow" boolean DEFAULT false,
	"balance_workload" boolean DEFAULT true,
	"notify_on_new_booking" boolean DEFAULT true,
	"notification_email" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "file_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"entity_type" "attachment_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"job_id" uuid,
	"customer_id" uuid,
	"uploaded_by_id" uuid,
	"file_name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"thumbnail_url" text,
	"mime_type" varchar(100),
	"file_size_bytes" integer,
	"file_type" varchar(30) DEFAULT 'photo',
	"caption" text,
	"photo_type" varchar(20) DEFAULT 'general',
	"taken_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "on_the_way_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"technician_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"sent_at" timestamp,
	"channel" varchar(20) DEFAULT 'sms',
	"message" text,
	"estimated_arrival_minutes" integer,
	"technician_lat" numeric(10, 7),
	"technician_lng" numeric(10, 7),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "review_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"job_id" uuid,
	"customer_id" uuid NOT NULL,
	"technician_id" uuid,
	"reference_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"status" "review_request_status" DEFAULT 'pending' NOT NULL,
	"channel" varchar(20) DEFAULT 'sms',
	"review_url" text,
	"sent_at" timestamp,
	"clicked_at" timestamp,
	"completed_at" timestamp,
	"rating" integer,
	"review_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"technician_id" uuid NOT NULL,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"duration_minutes" integer,
	"entry_type" varchar(30) DEFAULT 'on_site',
	"notes" text,
	"travel_from_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_assigned_technician_id_technicians_id_fk" FOREIGN KEY ("assigned_technician_id") REFERENCES "public"."technicians"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_settings" ADD CONSTRAINT "booking_settings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_attachments" ADD CONSTRAINT "file_attachments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_attachments" ADD CONSTRAINT "file_attachments_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "on_the_way_notifications" ADD CONSTRAINT "on_the_way_notifications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "on_the_way_notifications" ADD CONSTRAINT "on_the_way_notifications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "on_the_way_notifications" ADD CONSTRAINT "on_the_way_notifications_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "on_the_way_notifications" ADD CONSTRAINT "on_the_way_notifications_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_requests_company_idx" ON "booking_requests" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "booking_requests_status_idx" ON "booking_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "booking_requests_zip_idx" ON "booking_requests" USING btree ("zip");--> statement-breakpoint
CREATE INDEX "booking_requests_source_idx" ON "booking_requests" USING btree ("source");--> statement-breakpoint
CREATE INDEX "booking_requests_phone_idx" ON "booking_requests" USING btree ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_settings_company_idx" ON "booking_settings" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_settings_slug_idx" ON "booking_settings" USING btree ("booking_slug");--> statement-breakpoint
CREATE INDEX "file_attachments_company_idx" ON "file_attachments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "file_attachments_entity_idx" ON "file_attachments" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "file_attachments_job_idx" ON "file_attachments" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "file_attachments_customer_idx" ON "file_attachments" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "on_the_way_company_idx" ON "on_the_way_notifications" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "on_the_way_job_idx" ON "on_the_way_notifications" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "review_requests_company_idx" ON "review_requests" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "review_requests_customer_idx" ON "review_requests" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "review_requests_job_idx" ON "review_requests" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "review_requests_status_idx" ON "review_requests" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "review_requests_reference_idx" ON "review_requests" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX "time_entries_company_idx" ON "time_entries" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "time_entries_job_idx" ON "time_entries" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "time_entries_technician_idx" ON "time_entries" USING btree ("technician_id");