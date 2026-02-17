CREATE TABLE "actors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "walkthrough_actors" (
	"walkthrough_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "walkthrough_actors_walkthrough_id_actor_id_pk" PRIMARY KEY("walkthrough_id","actor_id")
);
--> statement-breakpoint
ALTER TABLE "walkthroughs" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "actors" ADD CONSTRAINT "actors_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "walkthrough_actors" ADD CONSTRAINT "walkthrough_actors_walkthrough_id_walkthroughs_id_fk" FOREIGN KEY ("walkthrough_id") REFERENCES "public"."walkthroughs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "walkthrough_actors" ADD CONSTRAINT "walkthrough_actors_actor_id_actors_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."actors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "actors_project_slug_idx" ON "actors" USING btree ("project_id","slug");