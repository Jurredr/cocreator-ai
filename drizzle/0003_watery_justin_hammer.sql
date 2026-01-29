ALTER TABLE "ideas" ALTER COLUMN "content" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "ideas" ADD COLUMN "graph_data" jsonb;