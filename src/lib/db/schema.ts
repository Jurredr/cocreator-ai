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

export const ideas = pgTable("ideas", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id")
    .notNull()
    .references(() => channels.id, { onDelete: "cascade" }),
  bucketId: uuid("bucket_id").references(() => buckets.id, {
    onDelete: "set null",
  }),
  content: text("content").notNull(),
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
  ideaId: uuid("idea_id")
    .notNull()
    .references(() => ideas.id, { onDelete: "cascade" }),
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
  ideaId: uuid("idea_id").references(() => ideas.id, { onDelete: "set null" }),
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
  /** When the clip was added to the b-roll library. */
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
  ideas: many(ideas, { relationName: "channelIdeas" }),
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
  ideas: many(ideas, { relationName: "bucketIdeas" }),
}));

export const ideasRelations = relations(ideas, ({ one, many }) => ({
  channel: one(channels, {
    fields: [ideas.channelId],
    references: [channels.id],
    relationName: "channelIdeas",
  }),
  bucket: one(buckets, {
    fields: [ideas.bucketId],
    references: [buckets.id],
    relationName: "bucketIdeas",
  }),
  contentOutputs: many(contentOutputs),
  publishedContent: many(publishedContent, { relationName: "ideaPublishedContent" }),
}));

export const contentOutputsRelations = relations(contentOutputs, ({ one }) => ({
  idea: one(ideas, {
    fields: [contentOutputs.ideaId],
    references: [ideas.id],
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
    idea: one(ideas, {
      fields: [publishedContent.ideaId],
      references: [ideas.id],
      relationName: "ideaPublishedContent",
    }),
  })
);

export const brollRelations = relations(broll, ({ one }) => ({
  channel: one(channels, {
    fields: [broll.channelId],
    references: [channels.id],
    relationName: "channelBroll",
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
