ALTER TYPE "public"."activity_event_type" ADD VALUE 'customer.deleted' BEFORE 'customer.merged';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'property.deleted' BEFORE 'asset.created';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'asset.deleted' BEFORE 'asset.serviced';