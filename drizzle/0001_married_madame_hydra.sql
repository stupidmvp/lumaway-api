ALTER TABLE "api_keys" ADD COLUMN "name" text DEFAULT 'Default Key' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "logo" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;