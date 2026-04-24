CREATE TABLE "observer_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"created_by" uuid,
	"intent" text,
	"status" text DEFAULT 'recording' NOT NULL,
	"video_s3_key" text,
	"video_duration_ms" integer,
	"processing_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "observer_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"observer_session_id" uuid NOT NULL,
	"type" text NOT NULL,
	"timestamp_ms" integer NOT NULL,
	"url" text,
	"target_selector" text,
	"label" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "observer_sessions" ADD CONSTRAINT "observer_sessions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observer_sessions" ADD CONSTRAINT "observer_sessions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observer_events" ADD CONSTRAINT "observer_events_observer_session_id_observer_sessions_id_fk" FOREIGN KEY ("observer_session_id") REFERENCES "public"."observer_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "observer_sessions_project_idx" ON "observer_sessions" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "observer_sessions_status_idx" ON "observer_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "observer_events_session_ts_idx" ON "observer_events" USING btree ("observer_session_id","timestamp_ms");
