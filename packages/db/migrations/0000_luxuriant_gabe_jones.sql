CREATE TYPE "public"."activity_event_type" AS ENUM('company.created', 'company.updated', 'user.registered', 'user.login', 'user.logout', 'user.password_reset', 'customer.created', 'customer.updated', 'customer.merged', 'property.created', 'property.updated', 'asset.created', 'asset.updated', 'asset.serviced', 'job.created', 'job.updated', 'job.scheduled', 'job.dispatched', 'job.started', 'job.paused', 'job.completed', 'job.reopened', 'job.rescheduled', 'job.cancelled', 'job.closed', 'estimate.created', 'estimate.sent', 'estimate.viewed', 'estimate.approved', 'estimate.declined', 'estimate.expired', 'estimate.revised', 'invoice.created', 'invoice.sent', 'invoice.viewed', 'invoice.overdue', 'invoice.void', 'payment.received', 'payment.partial', 'payment.failed', 'payment.refunded', 'technician.assigned', 'technician.unassigned', 'maintenance_plan.created', 'maintenance_plan.renewed', 'maintenance_plan.cancelled', 'maintenance_visit.completed', 'ai.recommendation_created', 'ai.recommendation_actioned', 'ai.recommendation_dismissed', 'campaign.sent', 'campaign.opened', 'campaign.replied', 'message.sent', 'message.received');--> statement-breakpoint
CREATE TYPE "public"."ai_recommendation_status" AS ENUM('pending', 'actioned', 'dismissed', 'snoozed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."ai_recommendation_type" AS ENUM('reactivation', 'aging_asset', 'maintenance_due', 'unsold_estimate', 'unpaid_invoice', 'upsell_opportunity', 'seasonal_campaign', 'maintenance_plan_offer');--> statement-breakpoint
CREATE TYPE "public"."asset_condition" AS ENUM('excellent', 'good', 'fair', 'poor', 'failed');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'scheduled', 'sending', 'sent', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."campaign_type" AS ENUM('reactivation', 'estimate_follow_up', 'invoice_reminder', 'seasonal', 'maintenance_reminder', 'custom');--> statement-breakpoint
CREATE TYPE "public"."estimate_status" AS ENUM('draft', 'sent', 'viewed', 'approved', 'declined', 'expired', 'converted');--> statement-breakpoint
CREATE TYPE "public"."form_type" AS ENUM('job_checklist', 'maintenance_checklist', 'inspection_report', 'customer_intake', 'install_checklist', 'safety_checklist', 'custom');--> statement-breakpoint
CREATE TYPE "public"."import_entity_type" AS ENUM('customers', 'properties', 'assets', 'jobs', 'estimates', 'invoices');--> statement-breakpoint
CREATE TYPE "public"."import_session_status" AS ENUM('uploaded', 'mapping', 'preview', 'importing', 'completed', 'failed', 'rolled_back');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'void', 'written_off');--> statement-breakpoint
CREATE TYPE "public"."job_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('lead', 'estimate_requested', 'estimate_sent', 'estimate_approved', 'scheduled', 'dispatched', 'in_progress', 'on_hold', 'completed', 'invoiced', 'paid', 'cancelled', 'closed');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('service_call', 'maintenance', 'installation', 'inspection', 'estimate_only', 'warranty', 'callback', 'emergency');--> statement-breakpoint
CREATE TYPE "public"."maintenance_plan_frequency" AS ENUM('monthly', 'bi_monthly', 'quarterly', 'bi_annual', 'annual');--> statement-breakpoint
CREATE TYPE "public"."maintenance_plan_status" AS ENUM('active', 'paused', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."message_channel" AS ENUM('sms', 'email', 'in_app');--> statement-breakpoint
CREATE TYPE "public"."message_direction" AS ENUM('outbound', 'inbound');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('card', 'ach', 'cash', 'check', 'financing', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'succeeded', 'failed', 'refunded', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('residential', 'commercial', 'industrial', 'multi_family');--> statement-breakpoint
CREATE TYPE "public"."service_agreement_billing_cycle" AS ENUM('monthly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."technician_status" AS ENUM('active', 'inactive', 'on_leave');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'admin', 'dispatcher', 'office', 'technician');--> statement-breakpoint
CREATE TABLE "activity_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"event_type" "activity_event_type" NOT NULL,
	"actor_id" uuid,
	"actor_type" varchar(30) DEFAULT 'user',
	"actor_name" varchar(255),
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"customer_id" uuid,
	"job_id" uuid,
	"estimate_id" uuid,
	"invoice_id" uuid,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"summary" text NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"type" "ai_recommendation_type" NOT NULL,
	"status" "ai_recommendation_status" DEFAULT 'pending' NOT NULL,
	"customer_id" uuid,
	"property_id" uuid,
	"asset_id" uuid,
	"job_id" uuid,
	"estimate_id" uuid,
	"invoice_id" uuid,
	"estimated_revenue" numeric(10, 2),
	"headline" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"suggested_action" varchar(100),
	"suggested_message" text,
	"urgency_score" integer,
	"confidence_score" integer,
	"actioned_at" timestamp,
	"actioned_by_id" uuid,
	"dismissed_at" timestamp,
	"snoozed_until" timestamp,
	"expires_at" timestamp,
	"source_event_ids" uuid[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"asset_type" varchar(100) NOT NULL,
	"brand" varchar(100),
	"model" varchar(100),
	"serial_number" varchar(100),
	"install_date" date,
	"warranty_expiration" date,
	"last_service_date" date,
	"next_service_date" date,
	"condition" "asset_condition",
	"condition_notes" text,
	"condition_score" integer,
	"replacement_probability" numeric(5, 4),
	"photo_urls" text[] DEFAULT '{}',
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "campaign_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"opened_at" timestamp,
	"replied_at" timestamp,
	"converted_at" timestamp,
	"conversion_job_id" uuid,
	"sent_to_phone" varchar(30),
	"sent_to_email" varchar(255),
	"unsubscribed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"created_by_id" uuid,
	"type" "campaign_type" NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject" varchar(255),
	"body" text NOT NULL,
	"channel" "message_channel" DEFAULT 'sms' NOT NULL,
	"is_ai_generated" boolean DEFAULT false,
	"ai_recommendation_id" uuid,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"recipient_count" integer DEFAULT 0,
	"delivered_count" integer DEFAULT 0,
	"opened_count" integer DEFAULT 0,
	"replied_count" integer DEFAULT 0,
	"converted_count" integer DEFAULT 0,
	"revenue_attributed" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"phone" varchar(30),
	"email" varchar(255),
	"website" varchar(255),
	"logo_url" text,
	"address_line_1" varchar(255),
	"address_line_2" varchar(255),
	"city" varchar(100),
	"state" varchar(50),
	"zip" varchar(20),
	"country" varchar(50) DEFAULT 'US' NOT NULL,
	"timezone" varchar(60) DEFAULT 'America/Chicago' NOT NULL,
	"stripe_customer_id" varchar(100),
	"stripe_account_id" varchar(100),
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"display_name" varchar(255),
	"email" varchar(255),
	"phone" varchar(30),
	"alt_phone" varchar(30),
	"lead_source" varchar(100),
	"referred_by" uuid,
	"tags" text[] DEFAULT '{}',
	"internal_notes" text,
	"lifetime_value" numeric(10, 2) DEFAULT '0',
	"total_jobs" integer DEFAULT 0,
	"last_service_date" date,
	"first_service_date" date,
	"prefers_sms" boolean DEFAULT true,
	"prefers_email" boolean DEFAULT true,
	"do_not_contact" boolean DEFAULT false,
	"stripe_customer_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "estimate_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estimate_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"item_type" varchar(30) DEFAULT 'service' NOT NULL,
	"quantity" numeric(10, 3) DEFAULT '1' NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"is_taxable" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "estimates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"estimate_number" varchar(30) NOT NULL,
	"job_id" uuid,
	"customer_id" uuid NOT NULL,
	"property_id" uuid,
	"created_by_id" uuid,
	"status" "estimate_status" DEFAULT 'draft' NOT NULL,
	"tier_label" varchar(50),
	"tier_group_id" uuid,
	"is_selected_tier" boolean DEFAULT false,
	"subtotal" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tax_rate" numeric(5, 4) DEFAULT '0',
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"title" varchar(255),
	"message_to_customer" text,
	"internal_notes" text,
	"approval_token" varchar(100),
	"approved_at" timestamp,
	"approved_by_name" varchar(255),
	"approved_signature_url" text,
	"declined_at" timestamp,
	"decline_reason" text,
	"expires_at" timestamp,
	"sent_at" timestamp,
	"viewed_at" timestamp,
	"follow_up_sent_at" timestamp,
	"financing_offered" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "form_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"form_template_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"asset_id" uuid,
	"submitted_by_id" uuid,
	"responses" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"passed_inspection" boolean,
	"failure_notes" text,
	"started_at" timestamp,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "form_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"form_type" "form_type" NOT NULL,
	"description" text,
	"fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"applicable_asset_types" text[] DEFAULT '{}',
	"is_system_template" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "import_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"created_by_id" uuid,
	"entity_type" "import_entity_type" NOT NULL,
	"status" "import_session_status" DEFAULT 'uploaded' NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"total_rows" integer DEFAULT 0,
	"valid_rows" integer DEFAULT 0,
	"error_rows" integer DEFAULT 0,
	"imported_rows" integer DEFAULT 0,
	"skipped_rows" integer DEFAULT 0,
	"duplicate_rows" integer DEFAULT 0,
	"column_mappings" jsonb DEFAULT '{}'::jsonb,
	"validation_errors" jsonb DEFAULT '[]'::jsonb,
	"ai_inferences" jsonb DEFAULT '{}'::jsonb,
	"rolled_back_at" timestamp,
	"rolled_back_by_id" uuid,
	"completed_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"item_type" varchar(30) DEFAULT 'service' NOT NULL,
	"quantity" numeric(10, 3) DEFAULT '1' NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"is_taxable" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"invoice_number" varchar(30) NOT NULL,
	"job_id" uuid,
	"estimate_id" uuid,
	"customer_id" uuid NOT NULL,
	"created_by_id" uuid,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"subtotal" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tax_rate" numeric(5, 4) DEFAULT '0',
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"amount_paid" numeric(10, 2) DEFAULT '0',
	"balance_due" numeric(10, 2) DEFAULT '0' NOT NULL,
	"issued_at" timestamp,
	"due_at" timestamp,
	"sent_at" timestamp,
	"viewed_at" timestamp,
	"paid_at" timestamp,
	"stripe_payment_link_id" varchar(100),
	"stripe_payment_link_url" text,
	"payment_token" varchar(100),
	"reminder_1_sent_at" timestamp,
	"reminder_2_sent_at" timestamp,
	"reminder_3_sent_at" timestamp,
	"message_to_customer" text,
	"internal_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "job_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"author_id" uuid,
	"content" text NOT NULL,
	"is_internal" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "job_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"uploaded_by_id" uuid,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"caption" text,
	"taken_at" timestamp,
	"photo_type" varchar(30) DEFAULT 'general',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"job_number" varchar(30) NOT NULL,
	"customer_id" uuid NOT NULL,
	"property_id" uuid,
	"asset_id" uuid,
	"technician_id" uuid,
	"assigned_by_id" uuid,
	"type" "job_type" DEFAULT 'service_call' NOT NULL,
	"priority" "job_priority" DEFAULT 'normal' NOT NULL,
	"status" "job_status" DEFAULT 'lead' NOT NULL,
	"lead_source" varchar(100),
	"title" varchar(255) NOT NULL,
	"description" text,
	"scheduled_start" timestamp,
	"scheduled_end" timestamp,
	"scheduled_duration_minutes" integer,
	"actual_start" timestamp,
	"actual_end" timestamp,
	"tech_notes" text,
	"completion_notes" text,
	"signature_url" text,
	"signed_at" timestamp,
	"signed_by_name" varchar(255),
	"estimate_total" numeric(10, 2),
	"invoice_total" numeric(10, 2),
	"amount_paid" numeric(10, 2) DEFAULT '0',
	"maintenance_plan_id" uuid,
	"parent_job_id" uuid,
	"tags" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "maintenance_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"property_id" uuid,
	"service_agreement_template_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"included_services" text[] DEFAULT '{}',
	"frequency" "maintenance_plan_frequency" NOT NULL,
	"status" "maintenance_plan_status" DEFAULT 'active' NOT NULL,
	"price" numeric(10, 2),
	"billing_cycle" "service_agreement_billing_cycle" DEFAULT 'annual',
	"stripe_subscription_id" varchar(100),
	"stripe_price_id" varchar(100),
	"stripe_current_period_start" timestamp,
	"stripe_current_period_end" timestamp,
	"stripe_cancel_at_period_end" boolean DEFAULT false,
	"start_date" date NOT NULL,
	"end_date" date,
	"next_service_date" date,
	"last_service_date" date,
	"asset_ids" uuid[] DEFAULT '{}',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "maintenance_visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"maintenance_plan_id" uuid NOT NULL,
	"job_id" uuid,
	"scheduled_date" date,
	"completed_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "message_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"customer_id" uuid,
	"job_id" uuid,
	"campaign_id" uuid,
	"channel" "message_channel" NOT NULL,
	"direction" "message_direction" NOT NULL,
	"to_address" varchar(255) NOT NULL,
	"from_address" varchar(255),
	"subject" varchar(255),
	"body" text NOT NULL,
	"provider_message_id" varchar(255),
	"provider_status" varchar(50),
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"failed_at" timestamp,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"collected_by_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"method" "payment_method" NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"stripe_payment_intent_id" varchar(100),
	"stripe_charge_id" varchar(100),
	"check_number" varchar(50),
	"reference_number" varchar(100),
	"notes" text,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"address_line_1" varchar(255) NOT NULL,
	"address_line_2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(50) NOT NULL,
	"zip" varchar(20) NOT NULL,
	"country" varchar(50) DEFAULT 'US',
	"lat" numeric(10, 7),
	"lng" numeric(10, 7),
	"type" "property_type" DEFAULT 'residential' NOT NULL,
	"sqft" integer,
	"year_built" integer,
	"access_notes" text,
	"notes" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"technician_id" uuid NOT NULL,
	"job_id" uuid,
	"is_blocked_time" boolean DEFAULT false,
	"block_reason" varchar(100),
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"travel_minutes_before" integer DEFAULT 0,
	"is_confirmed" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "service_agreement_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"included_services" text[] DEFAULT '{}',
	"visits_per_year" integer DEFAULT 2 NOT NULL,
	"frequency" "maintenance_plan_frequency" DEFAULT 'bi_annual' NOT NULL,
	"monthly_price" numeric(10, 2),
	"annual_price" numeric(10, 2),
	"stripe_mthly_price_id" varchar(100),
	"stripe_annual_price_id" varchar(100),
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"applicable_asset_types" text[] DEFAULT '{}',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "service_areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"zips" text[],
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "technicians" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255),
	"phone" varchar(30) NOT NULL,
	"avatar_url" text,
	"skills" text[] DEFAULT '{}',
	"service_area_ids" uuid[] DEFAULT '{}',
	"hours_per_day" numeric(4, 2) DEFAULT '8',
	"total_jobs_completed" integer DEFAULT 0,
	"avg_job_duration_minutes" integer,
	"estimate_close_rate" numeric(5, 4),
	"avg_ticket_value" numeric(10, 2),
	"status" "technician_status" DEFAULT 'active' NOT NULL,
	"calendar_color" varchar(7) DEFAULT '#6366f1',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"phone" varchar(30),
	"role" "user_role" DEFAULT 'office' NOT NULL,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"technician_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "public"."estimates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_actioned_by_id_users_id_fk" FOREIGN KEY ("actioned_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_conversion_job_id_jobs_id_fk" FOREIGN KEY ("conversion_job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_ai_recommendation_id_ai_recommendations_id_fk" FOREIGN KEY ("ai_recommendation_id") REFERENCES "public"."ai_recommendations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_items" ADD CONSTRAINT "estimate_items_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "public"."estimates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_items" ADD CONSTRAINT "estimate_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_form_template_id_form_templates_id_fk" FOREIGN KEY ("form_template_id") REFERENCES "public"."form_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_templates" ADD CONSTRAINT "form_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_sessions" ADD CONSTRAINT "import_sessions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_sessions" ADD CONSTRAINT "import_sessions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_sessions" ADD CONSTRAINT "import_sessions_rolled_back_by_id_users_id_fk" FOREIGN KEY ("rolled_back_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "public"."estimates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_notes" ADD CONSTRAINT "job_notes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_notes" ADD CONSTRAINT "job_notes_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_notes" ADD CONSTRAINT "job_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_photos" ADD CONSTRAINT "job_photos_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_photos" ADD CONSTRAINT "job_photos_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_photos" ADD CONSTRAINT "job_photos_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_plans" ADD CONSTRAINT "maintenance_plans_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_plans" ADD CONSTRAINT "maintenance_plans_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_plans" ADD CONSTRAINT "maintenance_plans_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_plans" ADD CONSTRAINT "maintenance_plans_service_agreement_template_id_service_agreement_templates_id_fk" FOREIGN KEY ("service_agreement_template_id") REFERENCES "public"."service_agreement_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_visits" ADD CONSTRAINT "maintenance_visits_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_visits" ADD CONSTRAINT "maintenance_visits_maintenance_plan_id_maintenance_plans_id_fk" FOREIGN KEY ("maintenance_plan_id") REFERENCES "public"."maintenance_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_visits" ADD CONSTRAINT "maintenance_visits_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_collected_by_id_users_id_fk" FOREIGN KEY ("collected_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_agreement_templates" ADD CONSTRAINT "service_agreement_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_areas" ADD CONSTRAINT "service_areas_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technicians" ADD CONSTRAINT "technicians_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technicians" ADD CONSTRAINT "technicians_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_events_company_idx" ON "activity_events" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "activity_events_entity_idx" ON "activity_events" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "activity_events_customer_idx" ON "activity_events" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "activity_events_job_idx" ON "activity_events" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "activity_events_event_type_idx" ON "activity_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "activity_events_occurred_at_idx" ON "activity_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "ai_recommendations_company_idx" ON "ai_recommendations" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "ai_recommendations_type_idx" ON "ai_recommendations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "ai_recommendations_status_idx" ON "ai_recommendations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_recommendations_customer_idx" ON "ai_recommendations" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "ai_recommendations_urgency_idx" ON "ai_recommendations" USING btree ("urgency_score");--> statement-breakpoint
CREATE INDEX "assets_property_idx" ON "assets" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "assets_customer_idx" ON "assets" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "assets_company_idx" ON "assets" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "assets_type_idx" ON "assets" USING btree ("asset_type");--> statement-breakpoint
CREATE INDEX "assets_warranty_idx" ON "assets" USING btree ("warranty_expiration");--> statement-breakpoint
CREATE INDEX "assets_install_idx" ON "assets" USING btree ("install_date");--> statement-breakpoint
CREATE INDEX "campaigns_company_idx" ON "campaigns" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "campaigns_status_idx" ON "campaigns" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "companies_slug_idx" ON "companies" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "customers_company_idx" ON "customers" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "customers_email_idx" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "customers_last_service_idx" ON "customers" USING btree ("last_service_date");--> statement-breakpoint
CREATE INDEX "estimates_company_idx" ON "estimates" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "estimates_customer_idx" ON "estimates" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "estimates_status_idx" ON "estimates" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "estimates_approval_token_idx" ON "estimates" USING btree ("approval_token");--> statement-breakpoint
CREATE UNIQUE INDEX "estimates_number_company_idx" ON "estimates" USING btree ("estimate_number","company_id");--> statement-breakpoint
CREATE INDEX "form_submissions_company_idx" ON "form_submissions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "form_submissions_job_idx" ON "form_submissions" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "form_submissions_template_idx" ON "form_submissions" USING btree ("form_template_id");--> statement-breakpoint
CREATE INDEX "form_templates_company_idx" ON "form_templates" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "form_templates_type_idx" ON "form_templates" USING btree ("form_type");--> statement-breakpoint
CREATE INDEX "form_templates_active_idx" ON "form_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "import_sessions_company_idx" ON "import_sessions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "import_sessions_status_idx" ON "import_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "import_sessions_entity_type_idx" ON "import_sessions" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "invoices_company_idx" ON "invoices" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "invoices_customer_idx" ON "invoices" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoices_due_idx" ON "invoices" USING btree ("due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_number_company_idx" ON "invoices" USING btree ("invoice_number","company_id");--> statement-breakpoint
CREATE INDEX "jobs_company_idx" ON "jobs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "jobs_customer_idx" ON "jobs" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "jobs_technician_idx" ON "jobs" USING btree ("technician_id");--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "jobs_scheduled_start_idx" ON "jobs" USING btree ("scheduled_start");--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_job_number_company_idx" ON "jobs" USING btree ("job_number","company_id");--> statement-breakpoint
CREATE INDEX "maintenance_plans_company_idx" ON "maintenance_plans" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "maintenance_plans_customer_idx" ON "maintenance_plans" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "maintenance_plans_next_service_idx" ON "maintenance_plans" USING btree ("next_service_date");--> statement-breakpoint
CREATE INDEX "maintenance_plans_status_idx" ON "maintenance_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "maintenance_plans_stripe_sub_idx" ON "maintenance_plans" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "message_logs_company_idx" ON "message_logs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "message_logs_customer_idx" ON "message_logs" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "message_logs_job_idx" ON "message_logs" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "payments_company_idx" ON "payments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "payments_invoice_idx" ON "payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "payments_stripe_intent_idx" ON "payments" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "properties_customer_idx" ON "properties" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "properties_company_idx" ON "properties" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "properties_zip_idx" ON "properties" USING btree ("zip");--> statement-breakpoint
CREATE INDEX "refresh_tokens_company_idx" ON "refresh_tokens" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "schedule_slots_technician_idx" ON "schedule_slots" USING btree ("technician_id");--> statement-breakpoint
CREATE INDEX "schedule_slots_start_time_idx" ON "schedule_slots" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "schedule_slots_job_idx" ON "schedule_slots" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "service_agreement_templates_company_idx" ON "service_agreement_templates" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "service_agreement_templates_active_idx" ON "service_agreement_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "technicians_company_idx" ON "technicians" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_company_idx" ON "users" USING btree ("email","company_id");--> statement-breakpoint
CREATE INDEX "users_company_idx" ON "users" USING btree ("company_id");