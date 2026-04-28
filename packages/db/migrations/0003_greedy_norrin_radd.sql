ALTER TYPE "public"."activity_event_type" ADD VALUE 'technician.created' BEFORE 'technician.assigned';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'technician.updated' BEFORE 'technician.assigned';--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE 'technician.deleted' BEFORE 'technician.assigned';