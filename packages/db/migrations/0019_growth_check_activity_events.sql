ALTER TYPE "public"."activity_event_type" ADD VALUE 'growth.check_scan_enqueued' BEFORE 'booking.requested';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'growth.check_scan_completed' BEFORE 'booking.requested';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'growth.check_scan_failed' BEFORE 'booking.requested';
