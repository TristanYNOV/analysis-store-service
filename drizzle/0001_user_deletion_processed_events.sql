CREATE TABLE IF NOT EXISTS "processed_events" (
	"event_id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "processed_events_event_type_idx" ON "processed_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "processed_events_processed_at_idx" ON "processed_events" USING btree ("processed_at");
