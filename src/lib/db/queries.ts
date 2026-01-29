import { eq, and, desc } from "drizzle-orm";
import { db } from "./index";
import {
  channels,
  buckets,
  ideas,
  contentOutputs,
  publishedContent,
  broll,
  hookInspiration,
} from "./schema";
import type { ContentOutputType } from "./schema";

export async function getChannelByUserId(userId: string) {
  const [channel] = await db
    .select()
    .from(channels)
    .where(eq(channels.userId, userId))
    .limit(1);
  return channel ?? null;
}

export async function getChannelWithBuckets(channelId: string) {
  const channel = await db.query.channels.findFirst({
    where: eq(channels.id, channelId),
    with: { buckets: true, inspirationVideos: true },
  });
  return channel ?? null;
}

export async function getIdeaByIdForChannel(ideaId: string, channelId: string) {
  const [idea] = await db
    .select()
    .from(ideas)
    .where(and(eq(ideas.id, ideaId), eq(ideas.channelId, channelId)))
    .limit(1);
  return idea ?? null;
}

export async function getRecentIdeas(channelId: string, limit = 10) {
  return db
    .select()
    .from(ideas)
    .where(eq(ideas.channelId, channelId))
    .orderBy(desc(ideas.createdAt))
    .limit(limit);
}

export async function getIdeasWithOutputs(channelId: string, limit = 20) {
  const list = await db
    .select()
    .from(ideas)
    .where(eq(ideas.channelId, channelId))
    .orderBy(desc(ideas.createdAt))
    .limit(limit);
  const withOutputs = await Promise.all(
    list.map(async (idea) => {
      const outputs = await db
        .select()
        .from(contentOutputs)
        .where(eq(contentOutputs.ideaId, idea.id));
      return { ...idea, outputs };
    })
  );
  return withOutputs;
}

export async function getBucketsByChannelId(channelId: string) {
  return db
    .select()
    .from(buckets)
    .where(eq(buckets.channelId, channelId));
}

export async function getHookInspirationByUserId(userId: string) {
  const [row] = await db
    .select()
    .from(hookInspiration)
    .where(eq(hookInspiration.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function getPublishedContentByChannelId(channelId: string) {
  return db
    .select()
    .from(publishedContent)
    .where(eq(publishedContent.channelId, channelId))
    .orderBy(desc(publishedContent.createdAt));
}

export async function getBrollByChannelId(channelId: string) {
  return db
    .select()
    .from(broll)
    .where(eq(broll.channelId, channelId))
    .orderBy(desc(broll.createdAt));
}

export type { ContentOutputType };
