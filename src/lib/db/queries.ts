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
  channelInspirationVideos,
} from "./schema";
import type { ContentOutputType } from "./schema";
import type { ChannelContextParams } from "@/lib/context/channel-context";

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

/** All data needed to build channel context for AI generation. */
export async function getChannelContextData(channelId: string): Promise<ChannelContextParams | null> {
  const [channel] = await db.select().from(channels).where(eq(channels.id, channelId)).limit(1);
  if (!channel) return null;

  const channelWithBuckets = await getChannelWithBuckets(channelId);
  const bucketsList = channelWithBuckets?.buckets ?? [];

  const recentIdeasRows = await db
    .select({ content: projects.content })
    .from(projects)
    .where(eq(projects.channelId, channelId))
    .orderBy(desc(projects.createdAt))
    .limit(10);
  const recentIdeas = recentIdeasRows.map((r) => r.content).filter(Boolean);

  const recentScriptsRows = await db
    .select({ content: contentOutputs.content })
    .from(contentOutputs)
    .innerJoin(projects, eq(projects.id, contentOutputs.projectId))
    .where(and(eq(projects.channelId, channelId), eq(contentOutputs.type, "script")))
    .orderBy(desc(contentOutputs.createdAt))
    .limit(10);
  const recentScripts = recentScriptsRows.map((r) => r.content);

  const summariesRows = await db
    .select({
      summary: projects.summary,
      sequenceLabel: projects.sequenceLabel,
      storyBeat: projects.storyBeat,
    })
    .from(projects)
    .where(eq(projects.channelId, channelId))
    .orderBy(desc(projects.createdAt))
    .limit(50);
  const projectSummaries = summariesRows.filter(
    (r) => r.summary != null || r.sequenceLabel != null || r.storyBeat != null
  );

  const inspirationRows = await db
    .select({ note: channelInspirationVideos.note, url: channelInspirationVideos.url })
    .from(channelInspirationVideos)
    .where(eq(channelInspirationVideos.channelId, channelId))
    .orderBy(desc(channelInspirationVideos.createdAt))
    .limit(10);
  const inspirationNotes = inspirationRows
    .map((r) => (r.note?.trim() ? r.note : r.url?.trim() ? `Video: ${r.url}` : null))
    .filter(Boolean) as string[];

  const topPerformersRows = await db
    .select({
      views: publishedContent.views,
      projectId: publishedContent.projectId,
      url: publishedContent.url,
    })
    .from(publishedContent)
    .where(eq(publishedContent.channelId, channelId))
    .orderBy(desc(publishedContent.views))
    .limit(5);
  const topPerformers: Array<{ titleOrIdea: string; views: number | null }> = await Promise.all(
    topPerformersRows.map(async (row) => {
      let titleOrIdea = row.url;
      if (row.projectId) {
        const [p] = await db
          .select({ content: projects.content })
          .from(projects)
          .where(eq(projects.id, row.projectId))
          .limit(1);
        if (p?.content?.trim()) titleOrIdea = p.content.slice(0, 120);
      }
      return { titleOrIdea, views: row.views };
    })
  );

  return {
    channelName: channel.name,
    coreAudience: channel.coreAudience,
    goals: channel.goals,
    buckets: bucketsList.map((b: { name: string; description: string | null }) => ({
      name: b.name,
      description: b.description,
    })),
    recentIdeas,
    recentScripts,
    projectSummaries,
    inspirationNotes,
    topPerformers,
    nextSequenceLabel: channel.nextSequenceLabel ?? undefined,
  };
}

export type { ContentOutputType };
