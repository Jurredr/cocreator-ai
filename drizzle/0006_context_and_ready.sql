-- Channel: optional next sequence label for series/challenge
ALTER TABLE "channels" ADD COLUMN IF NOT EXISTS "next_sequence_label" text;
--> statement-breakpoint
-- Projects: summary, sequence label, story beat for context/continuity
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "summary" text;
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "sequence_label" text;
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "story_beat" text;
