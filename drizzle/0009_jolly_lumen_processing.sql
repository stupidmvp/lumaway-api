CREATE TABLE "observer_chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"observer_session_id" uuid NOT NULL,
	"start_ms" integer NOT NULL,
	"end_ms" integer NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "observer_step_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"observer_session_id" uuid NOT NULL,
	"order" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"target_selector" text,
	"timestamp_ms" integer NOT NULL,
	"confidence" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "observer_chapters" ADD CONSTRAINT "observer_chapters_observer_session_id_observer_sessions_id_fk" FOREIGN KEY ("observer_session_id") REFERENCES "public"."observer_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observer_step_candidates" ADD CONSTRAINT "observer_step_candidates_observer_session_id_observer_sessions_id_fk" FOREIGN KEY ("observer_session_id") REFERENCES "public"."observer_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "observer_chapters_session_start_idx" ON "observer_chapters" USING btree ("observer_session_id","start_ms");--> statement-breakpoint
CREATE INDEX "observer_step_candidates_session_order_idx" ON "observer_step_candidates" USING btree ("observer_session_id","order");
