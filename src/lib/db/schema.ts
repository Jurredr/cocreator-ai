import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/** Supabase Auth user id is stored; we do not create auth users in Drizzle */
export const channels = pgTable("channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  coreAudience: text("core_audience"),
  goals: text("goals"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const buckets = pgTable("buckets", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id")
    .notNull()
    .references(() => channels.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectStatusEnum = pgEnum("project_status", [
  "idea",
  "scripting",
  "producing",
  "uploaded",
]);

export type ProjectStatus =
  | "idea"
  | "scripting"
  | "producing"
  | "uploaded";

export const projectContentTypeEnum = pgEnum("project_content_type", [
  "short-form",
  "long-form",
  "textual",
]);

export type ProjectContentType =
  | "short-form"
  | "long-form"
  | "textual";

/** Stored graph: { nodes: Array<{id, type, position: {x,y}, data}>, edges: Array<{id, source, target}> } */
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id")
    .notNull()
    .references(() => channels.id, { onDelete: "cascade" }),
  bucketId: uuid("bucket_id").references(() => buckets.id, {
    onDelete: "set null",
  }),
  /** Root idea text; also used when graph_data is null (legacy). */
  content: text("content").notNull().default(""),
  /** React Flow graph: nodes (idea, subIdea, hook, script, description, hashtags) + edges. */
  graphData: jsonb("graph_data"),
  status: projectStatusEnum("status").notNull().default("idea"),
  /** short-form (e.g. Reels/TikTok), long-form (e.g. YouTube), or textual (+ optional images). */
  contentType: projectContentTypeEnum("content_type").notNull().default("short-form"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contentOutputTypeEnum = pgEnum("content_output_type", [
  "title",
  "description",
  "hashtags",
  "script",
  "hooks",
]);

export type ContentOutputType =
  | "title"
  | "description"
  | "hashtags"
  | "script"
  | "hooks";

export const contentOutputs = pgTable("content_outputs", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  type: contentOutputTypeEnum("type").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const platformEnum = pgEnum("platform", [
  "tiktok",
  "instagram",
  "youtube",
]);

export const publishedContent = pgTable("published_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id")
    .notNull()
    .references(() => channels.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  platform: platformEnum("platform").notNull(),
  url: text("url").notNull(),
  views: integer("views"),
  likes: integer("likes"),
  comments: integer("comments"),
  shares: integer("shares"),
  extraMetrics: jsonb("extra_metrics"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const mediaTypeEnum = pgEnum("media_type", ["video", "image"]);
export type MediaType = "video" | "image";

export const mediaOrientationEnum = pgEnum("media_orientation", [
  "vertical",
  "horizontal",
]);
export type MediaOrientation = "vertical" | "horizontal";

export const mediaSourceEnum = pgEnum("media_source", [
  "uploaded",
  "ai_generated",
]);
export type MediaSource = "uploaded" | "ai_generated";

/** Media library: videos (B-roll), images (thumbnails, posts, AI-generated). */
export const broll = pgTable("broll", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id")
    .notNull()
    .references(() => channels.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  thumbnailDataUrl: text("thumbnail_data_url").notNull(),
  description: text("description"),
  /** Recording date from video file metadata (e.g. file lastModified or embedded creation time). */
  recordingDate: timestamp("recording_date"),
  /** video (B-roll) or image (thumbnails, posts, AI-generated). */
  mediaType: mediaTypeEnum("media_type").notNull().default("video"),
  /** For video: vertical (9:16) or horizontal (16:9). Null for images. */
  orientation: mediaOrientationEnum("orientation"),
  /** uploaded by user or ai_generated (e.g. from a project). */
  source: mediaSourceEnum("source").notNull().default("uploaded"),
  /** When source is ai_generated, optional project this media belongs to. */
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  /** When the item was added to the media library. */
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Video links that inspire the channel vibe; optional note on what the user likes. */
export const channelInspirationVideos = pgTable("channel_inspiration_videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id")
    .notNull()
    .references(() => channels.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Per-user hook inspiration list (raw text, one hook per line). Optional; static file also supported. */
export const hookInspiration = pgTable("hook_inspiration", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  hooksText: text("hooks_text").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations (explicit fields/references so Drizzle can infer joins)
export const channelsRelations = relations(channels, ({ many }) => ({
  buckets: many(buckets, { relationName: "channelBuckets" }),
  projects: many(projects, { relationName: "channelProjects" }),
  publishedContent: many(publishedContent, { relationName: "channelPublishedContent" }),
  broll: many(broll, { relationName: "channelBroll" }),
  inspirationVideos: many(channelInspirationVideos, { relationName: "channelInspirationVideos" }),
}));

export const bucketsRelations = relations(buckets, ({ one, many }) => ({
  channel: one(channels, {
    fields: [buckets.channelId],
    references: [channels.id],
    relationName: "channelBuckets",
  }),
  projects: many(projects, { relationName: "bucketProjects" }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  channel: one(channels, {
    fields: [projects.channelId],
    references: [channels.id],
    relationName: "channelProjects",
  }),
  bucket: one(buckets, {
    fields: [projects.bucketId],
    references: [buckets.id],
    relationName: "bucketProjects",
  }),
  contentOutputs: many(contentOutputs),
  publishedContent: many(publishedContent, { relationName: "projectPublishedContent" }),
  media: many(broll, { relationName: "projectMedia" }),
}));

export const contentOutputsRelations = relations(contentOutputs, ({ one }) => ({
  project: one(projects, {
    fields: [contentOutputs.projectId],
    references: [projects.id],
  }),
}));

export const publishedContentRelations = relations(
  publishedContent,
  ({ one }) => ({
    channel: one(channels, {
      fields: [publishedContent.channelId],
      references: [channels.id],
      relationName: "channelPublishedContent",
    }),
    project: one(projects, {
      fields: [publishedContent.projectId],
      references: [projects.id],
      relationName: "projectPublishedContent",
    }),
  })
);

export const brollRelations = relations(broll, ({ one }) => ({
  channel: one(channels, {
    fields: [broll.channelId],
    references: [channels.id],
    relationName: "channelBroll",
  }),
  project: one(projects, {
    fields: [broll.projectId],
    references: [projects.id],
    relationName: "projectMedia",
  }),
}));

export const channelInspirationVideosRelations = relations(
  channelInspirationVideos,
  ({ one }) => ({
    channel: one(channels, {
      fields: [channelInspirationVideos.channelId],
      references: [channels.id],
      relationName: "channelInspirationVideos",
    }),
  })
);
