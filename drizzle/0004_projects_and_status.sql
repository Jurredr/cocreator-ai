-- Create project_status enum
DO $$ BEGIN
 CREATE TYPE "public"."project_status" AS ENUM('idea', 'scripting', 'producing', 'uploaded');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- Add status column to ideas
ALTER TABLE "ideas" ADD COLUMN "status" "project_status" DEFAULT 'idea' NOT NULL;
--> statement-breakpoint
-- Rename table ideas to projects
ALTER TABLE "ideas" RENAME TO "projects";
--> statement-breakpoint
-- Rename idea_id to project_id in content_outputs
ALTER TABLE "content_outputs" RENAME COLUMN "idea_id" TO "project_id";
--> statement-breakpoint
-- Rename idea_id to project_id in published_content
ALTER TABLE "published_content" RENAME COLUMN "idea_id" TO "project_id";
