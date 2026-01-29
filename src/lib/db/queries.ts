import { eq, and, desc } from "drizzle-orm";
import { db } from "./index";
import {
  channels,
  buckets,
  projects,
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

export async function getProjectByIdForChannel(projectId: string, channelId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.channelId, channelId)))
    .limit(1);
  return project ?? null;
}

export async function getRecentProjects(channelId: string, limit = 10) {
  return db
    .select()
    .from(projects)
    .where(eq(projects.channelId, channelId))
    .orderBy(desc(projects.createdAt))
    .limit(limit);
}

export async function getProjectsWithOutputs(channelId: string, limit = 20) {
  const list = await db
    .select()
    .from(projects)
    .where(eq(projects.channelId, channelId))
    .orderBy(desc(projects.createdAt))
    .limit(limit);
  const withOutputs = await Promise.all(
    list.map(async (project) => {
      const outputs = await db
        .select()
        .from(contentOutputs)
        .where(eq(contentOutputs.projectId, project.id));
      return { ...project, outputs };
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
