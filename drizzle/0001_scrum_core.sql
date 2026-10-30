CREATE TYPE "public"."issue_type" AS ENUM('epic', 'story', 'task', 'bug');--> statement-breakpoint
CREATE TYPE "public"."sprint_status" AS ENUM('planned', 'active', 'completed');--> statement-breakpoint
CREATE TABLE "sprints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"goal" text,
	"status" "sprint_status" DEFAULT 'planned' NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"committed_points" integer,
	"completed_points" integer,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "number" integer;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "issue_type" "issue_type" DEFAULT 'task' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "sprint_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "story_points" integer;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "issue_key_prefix" varchar(10) DEFAULT 'ORB' NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "issue_counter" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sprints_workspace_status_idx" ON "sprints" USING btree ("workspace_id","status");--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_id_tasks_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sprint_id_sprints_id_fk" FOREIGN KEY ("sprint_id") REFERENCES "public"."sprints"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tasks_sprint_id" ON "tasks" USING btree ("sprint_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_parent_id" ON "tasks" USING btree ("parent_id");--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_workspace_number_unique" UNIQUE("workspace_id","number");--> statement-breakpoint
-- Backfill issue numbers for existing tasks (oldest first) and sync each workspace's counter.
UPDATE "tasks" AS t SET "number" = ranked.rn
FROM (SELECT "id", row_number() OVER (PARTITION BY "workspace_id" ORDER BY "created_at", "id") AS rn FROM "tasks") AS ranked
WHERE t."id" = ranked."id";--> statement-breakpoint
UPDATE "workspaces" AS w SET "issue_counter" = COALESCE((SELECT max(t."number") FROM "tasks" AS t WHERE t."workspace_id" = w."id"), 0);
