DO $$ BEGIN
 CREATE TYPE "public"."agent_action_state" AS ENUM('proposed', 'policy_evaluated', 'awaiting_approval', 'approved', 'executing', 'succeeded', 'failed', 'expired', 'cancelled', 'escalated');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."agent_product" AS ENUM('revenue', 'scheduling', 'service', 'retention', 'owner');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE IF NOT EXISTS 'agent.proposal_created';
--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE IF NOT EXISTS 'agent.proposal_approved';
--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE IF NOT EXISTS 'agent.proposal_rejected';
--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE IF NOT EXISTS 'agent.execution_succeeded';
--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE IF NOT EXISTS 'agent.execution_failed';
--> statement-breakpoint
ALTER TYPE "public"."activity_event_type" ADD VALUE IF NOT EXISTS 'revenue.inquiry_qualified';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agent_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"agent_product" "agent_product" NOT NULL,
	"action_type" varchar(100) NOT NULL,
	"parameters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"target" jsonb NOT NULL,
	"source_event_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"idempotency_key" varchar(128) NOT NULL,
	"payload_hash" varchar(128) NOT NULL,
	"policy_version" varchar(64) NOT NULL,
	"requires_approval" boolean NOT NULL,
	"state" "agent_action_state" DEFAULT 'proposed' NOT NULL,
	"confidence" numeric(5, 4),
	"reason" text,
	"expires_at" timestamp NOT NULL,
	"reviewer_id" uuid,
	"execution_receipt" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "agent_actions_company_idempotency_idx" ON "agent_actions" USING btree ("company_id","idempotency_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_actions_company_state_idx" ON "agent_actions" USING btree ("company_id","state");
