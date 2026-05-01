ALTER TYPE "public"."attachment_entity_type" ADD VALUE 'company' BEFORE 'job';--> statement-breakpoint
ALTER TABLE "booking_settings" ADD COLUMN "custom_review_url" text;--> statement-breakpoint
ALTER TABLE "booking_settings" ADD COLUMN "tagline" text;