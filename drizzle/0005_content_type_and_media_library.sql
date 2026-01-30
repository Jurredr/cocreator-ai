-- Project content type: short-form, long-form, textual
DO $$ BEGIN
 CREATE TYPE "public"."project_content_type" AS ENUM('short-form', 'long-form', 'textual');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "content_type" "project_content_type" DEFAULT 'short-form' NOT NULL;
--> statement-breakpoint
-- Media library: type (video/image), orientation (vertical/horizontal), source (uploaded/ai_generated)
DO $$ BEGIN
 CREATE TYPE "public"."media_type" AS ENUM('video', 'image');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."media_orientation" AS ENUM('vertical', 'horizontal');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."media_source" AS ENUM('uploaded', 'ai_generated');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "broll" ADD COLUMN IF NOT EXISTS "media_type" "media_type" DEFAULT 'video' NOT NULL;
--> statement-breakpoint
ALTER TABLE "broll" ADD COLUMN IF NOT EXISTS "orientation" "media_orientation";
--> statement-breakpoint
ALTER TABLE "broll" ADD COLUMN IF NOT EXISTS "source" "media_source" DEFAULT 'uploaded' NOT NULL;
--> statement-breakpoint
ALTER TABLE "broll" ADD COLUMN IF NOT EXISTS "project_id" uuid;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "broll" ADD CONSTRAINT "broll_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
