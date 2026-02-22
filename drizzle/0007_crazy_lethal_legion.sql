CREATE TABLE "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"tier" text NOT NULL,
	"llm_models" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"max_rpm" integer DEFAULT 15 NOT NULL,
	"max_tokens_month" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_llm_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"project_id" uuid,
	"provider" text NOT NULL,
	"model_id" text NOT NULL,
	"encrypted_api_key" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "plan_id" uuid;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "settings" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_llm_keys" ADD CONSTRAINT "tenant_llm_keys_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_llm_keys" ADD CONSTRAINT "tenant_llm_keys_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_llm_keys_org_provider_idx" ON "tenant_llm_keys" USING btree ("organization_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_llm_keys_project_provider_idx" ON "tenant_llm_keys" USING btree ("project_id","provider");--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;
