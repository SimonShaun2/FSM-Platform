ALTER TYPE "public"."activity_event_type" ADD VALUE IF NOT EXISTS 'agent.proposal_edited';
--> statement-breakpoint
ALTER TABLE "agent_actions" ADD COLUMN IF NOT EXISTS "approved_parameters" jsonb;
