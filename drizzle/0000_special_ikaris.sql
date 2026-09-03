DO $$ BEGIN
	CREATE TYPE "public"."outbox_status" AS ENUM('pending', 'published', 'failed');
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."visibility" AS ENUM('private', 'club', 'public');
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"event_version" integer DEFAULT 1 NOT NULL,
	"aggregate_type" text,
	"aggregate_id" text,
	"payload_json" jsonb NOT NULL,
	"status" "outbox_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "panels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text NOT NULL,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"club_id" text,
	"title" text NOT NULL,
	"description" text,
	"has_anonymized_content" boolean DEFAULT false NOT NULL,
	"content_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sensitive_payload_encrypted" text,
	"crypto_suite" text,
	"key_version" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "panels_club_visibility_consistency" CHECK (("panels"."visibility" <> 'club' OR "panels"."club_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "timelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text NOT NULL,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"club_id" text,
	"title" text NOT NULL,
	"description" text,
	"has_anonymized_content" boolean DEFAULT false NOT NULL,
	"content_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sensitive_payload_encrypted" text,
	"crypto_suite" text,
	"key_version" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "timelines_club_visibility_consistency" CHECK (("timelines"."visibility" <> 'club' OR "timelines"."club_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outbox_events_status_idx" ON "outbox_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outbox_events_event_type_idx" ON "outbox_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outbox_events_aggregate_idx" ON "outbox_events" USING btree ("aggregate_type","aggregate_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outbox_events_created_at_idx" ON "outbox_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "panels_owner_user_id_idx" ON "panels" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "panels_visibility_idx" ON "panels" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "panels_club_id_idx" ON "panels" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "panels_created_at_idx" ON "panels" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "panels_updated_at_idx" ON "panels" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "timelines_owner_user_id_idx" ON "timelines" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "timelines_visibility_idx" ON "timelines" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "timelines_club_id_idx" ON "timelines" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "timelines_created_at_idx" ON "timelines" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "timelines_updated_at_idx" ON "timelines" USING btree ("updated_at");
