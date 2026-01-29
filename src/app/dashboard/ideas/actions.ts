"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { projects, contentOutputs } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  buildContext,
  generateIdeas as generateIdeasAI,
  generateContentOutput,
  brainstormSubIdeas as brainstormSubIdeasAI,
  brainstormNote as brainstormNoteAI,
} from "@/lib/openai";
import { getChannelByUserId, getChannelWithBuckets } from "@/lib/db/queries";
import { getHookInspirationSample } from "@/lib/hooks-file";
import type { ContentOutputType } from "@/lib/db/schema";
import type { IdeaGraphData } from "@/lib/idea-graph-types";
import type { IdeaNodeType } from "@/lib/idea-graph-types";

export async function generateAndSaveIdeas(formData: FormData): Promise<
  { error: string } | { success: true; ideaIds: string[] }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }
  const channel = await getChannelByUserId(user.id);
  if (!channel) {
    return { error: "Create a channel first" };
  }
  const channelWithBuckets = await getChannelWithBuckets(channel.id);
  const buckets = channelWithBuckets?.buckets ?? [];
  const bucketId = (formData.get("bucketId") as string)?.trim() || null;
  const roughIdea = (formData.get("roughIdea") as string)?.trim() || null;
  const focusBucketName = bucketId
    ? buckets.find((b: { id: string }) => b.id === bucketId)?.name ?? null
    : null;

  const recentIdeas = await db
    .select({ content: projects.content })
    .from(projects)
    .where(eq(projects.channelId, channel.id))
    .orderBy(desc(projects.createdAt))
    .limit(5);
  const recentScripts = await db
    .select({ content: contentOutputs.content })
    .from(contentOutputs)
    .innerJoin(projects, eq(projects.id, contentOutputs.projectId))
    .where(eq(projects.channelId, channel.id))
    .orderBy(desc(contentOutputs.createdAt))
    .limit(3);
  const channelContext = buildContext({
    channelName: channel.name,
    coreAudience: channel.coreAudience,
    goals: channel.goals,
    buckets: buckets.map((b: { name: string; description: string | null }) => ({ name: b.name, description: b.description })),
    recentIdeas: recentIdeas.map((r) => r.content),
    recentScripts: recentScripts.map((r) => r.content),
  });
  try {
    const generated = await generateIdeasAI({
      channelContext,
      count: 3,
      focusBucketName: focusBucketName ?? undefined,
      roughIdea: roughIdea || undefined,
    });
    const projectIds: string[] = [];
    for (const content of generated) {
      if (!content?.trim()) continue;
      const [inserted] = await db
        .insert(projects)
        .values({
          channelId: channel.id,
          bucketId: bucketId || undefined,
          content: content.trim(),
        })
        .returning({ id: projects.id });
      if (inserted) projectIds.push(inserted.id);
    }
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/projects");
    return { success: true, ideaIds: projectIds };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to generate ideas",
    };
  }
}

/** Create an empty project (for canvas). */
export async function createEmptyProject(): Promise<
  { error: string } | { success: true; projectId: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }
  const channel = await getChannelByUserId(user.id);
  if (!channel) {
    return { error: "Create a channel first" };
  }
  const [inserted] = await db
    .insert(projects)
    .values({
      channelId: channel.id,
      content: "",
    })
    .returning({ id: projects.id });
  if (!inserted) {
    return { error: "Failed to create project" };
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${inserted.id}`);
  return { success: true, projectId: inserted.id };
}

export async function saveProject(formData: FormData): Promise<
  { error: string } | { success: true; projectId: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }
  const channel = await getChannelByUserId(user.id);
  if (!channel) {
    return { error: "Create a channel first" };
  }
  const content = (formData.get("content") as string)?.trim();
  const bucketId = (formData.get("bucketId") as string)?.trim() || null;
  if (!content) {
    return { error: "Project content is required" };
  }
  const [inserted] = await db
    .insert(projects)
    .values({
      channelId: channel.id,
      bucketId: bucketId || undefined,
      content,
    })
    .returning({ id: projects.id });
  if (!inserted) {
    return { error: "Failed to save project" };
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${inserted.id}`);
  return { success: true, projectId: inserted.id };
}

/** @deprecated Use saveProject. */
export const saveIdea = saveProject;

/** Generate idea text for the canvas (no DB insert). Returns strings to add as nodes. */
export async function generateIdeasForCanvas(params: {
  projectId: string;
  count?: number;
  bucketId?: string | null;
  roughIdea?: string | null;
}): Promise<{ error: string } | { success: true; ideas: string[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }
  const channel = await getChannelByUserId(user.id);
  if (!channel) {
    return { error: "Create a channel first" };
  }
  const channelWithBuckets = await getChannelWithBuckets(channel.id);
  const buckets = channelWithBuckets?.buckets ?? [];
  const bucketId = params.bucketId?.trim() || null;
  const focusBucketName = bucketId
    ? buckets.find((b: { id: string }) => b.id === bucketId)?.name ?? null
    : null;
  const recentIdeas = await db
    .select({ content: projects.content })
    .from(projects)
    .where(eq(projects.channelId, channel.id))
    .orderBy(desc(projects.createdAt))
    .limit(5);
  const recentScripts = await db
    .select({ content: contentOutputs.content })
    .from(contentOutputs)
    .innerJoin(projects, eq(projects.id, contentOutputs.projectId))
    .where(eq(projects.channelId, channel.id))
    .orderBy(desc(contentOutputs.createdAt))
    .limit(3);
  const channelContext = buildContext({
    channelName: channel.name,
    coreAudience: channel.coreAudience,
    goals: channel.goals,
    buckets: buckets.map((b: { name: string; description: string | null }) => ({
      name: b.name,
      description: b.description,
    })),
    recentIdeas: recentIdeas.map((r) => r.content),
    recentScripts: recentScripts.map((r) => r.content),
  });
  try {
    const generated = await generateIdeasAI({
      channelContext,
      count: params.count ?? 3,
      focusBucketName: focusBucketName ?? undefined,
      roughIdea: params.roughIdea ?? undefined,
    });
    return { success: true, ideas: generated };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to generate ideas",
    };
  }
}

export async function deleteProject(projectId: string): Promise<
  { error: string } | { success: true }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }
  const channel = await getChannelByUserId(user.id);
  if (!channel) {
    return { error: "Channel not found" };
  }
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.channelId, channel.id)))
    .limit(1);
  if (!project) {
    return { error: "Project not found" };
  }
  await db.delete(projects).where(eq(projects.id, projectId));
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  return { success: true };
}

/** @deprecated Use deleteProject. */
export async function deleteIdea(projectId: string) {
  return deleteProject(projectId);
}

export async function generateOutput(
  projectId: string,
  type: ContentOutputType
): Promise<{ error: string } | { success: true; content: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }
  const channel = await getChannelByUserId(user.id);
  if (!channel) {
    return { error: "Channel not found" };
  }
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.channelId, channel.id)))
    .limit(1);
  if (!project) {
    return { error: "Project not found" };
  }
  const channelWithBuckets = await getChannelWithBuckets(channel.id);
  const buckets = channelWithBuckets?.buckets ?? [];
  const channelContext = buildContext({
    channelName: channel.name,
    coreAudience: channel.coreAudience,
    goals: channel.goals,
    buckets: buckets.map((b: { name: string; description: string | null }) => ({ name: b.name, description: b.description })),
  });
  const hookSample =
    type === "hooks" ? await getHookInspirationSample() : undefined;
  try {
    const generatedContent = await generateContentOutput({
      channelContext,
      ideaContent: project.content,
      type,
      hookInspirationSample: hookSample,
    });
    await db.insert(contentOutputs).values({
      projectId: project.id,
      type,
      content: generatedContent,
    });
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, content: generatedContent };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to generate",
    };
  }
}

/** Save the project graph (canvas nodes/edges). */
export async function saveProjectGraph(
  projectId: string,
  graphData: IdeaGraphData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }
  const channel = await getChannelByUserId(user.id);
  if (!channel) {
    return { error: "Channel not found" };
  }
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.channelId, channel.id)))
    .limit(1);
  if (!project) {
    return { error: "Project not found" };
  }
  await db
    .update(projects)
    .set({ graphData })
    .where(eq(projects.id, projectId));
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}

/** Brainstorm/refine a single note (node) with AI. */
export async function brainstormNoteForNode(params: {
  projectId: string;
  nodeId: string;
  currentContent: string;
}): Promise<{ error: string } | { success: true; content: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }
  const channel = await getChannelByUserId(user.id);
  if (!channel) {
    return { error: "Channel not found" };
  }
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, params.projectId), eq(projects.channelId, channel.id)))
    .limit(1);
  if (!project) {
    return { error: "Project not found" };
  }
  const channelWithBuckets = await getChannelWithBuckets(channel.id);
  const buckets = channelWithBuckets?.buckets ?? [];
  const channelContext = buildContext({
    channelName: channel.name,
    coreAudience: channel.coreAudience,
    goals: channel.goals,
    buckets: buckets.map((b: { name: string; description: string | null }) => ({
      name: b.name,
      description: b.description,
    })),
  });
  try {
    const content = await brainstormNoteAI({
      channelContext,
      noteContent: params.currentContent || "Empty note — suggest something to add here.",
    });
    return { success: true, content };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to brainstorm",
    };
  }
}

/** Brainstorm sub-ideas for a parent idea node. */
export async function brainstormSubIdeasForNode(params: {
  projectId: string;
  parentContent: string;
  count?: number;
}): Promise<{ error: string } | { success: true; ideas: string[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }
  const channel = await getChannelByUserId(user.id);
  if (!channel) {
    return { error: "Channel not found" };
  }
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, params.projectId), eq(projects.channelId, channel.id)))
    .limit(1);
  if (!project) {
    return { error: "Project not found" };
  }
  const channelWithBuckets = await getChannelWithBuckets(channel.id);
  const buckets = channelWithBuckets?.buckets ?? [];
  const channelContext = buildContext({
    channelName: channel.name,
    coreAudience: channel.coreAudience,
    goals: channel.goals,
    buckets: buckets.map((b: { name: string; description: string | null }) => ({
      name: b.name,
      description: b.description,
    })),
  });
  try {
    const list = await brainstormSubIdeasAI({
      channelContext,
      parentIdeaContent: params.parentContent || "General content idea.",
      count: params.count ?? 4,
    });
    return { success: true, ideas: list };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to brainstorm sub-ideas",
    };
  }
}

/** Generate content for a step node (hook, script, description, hashtags) from graph context. */
export async function generateNodeContentForNode(params: {
  projectId: string;
  type: IdeaNodeType;
  contextContent: string;
}): Promise<{ error: string } | { success: true; content: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }
  const channel = await getChannelByUserId(user.id);
  if (!channel) {
    return { error: "Channel not found" };
  }
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, params.projectId), eq(projects.channelId, channel.id)))
    .limit(1);
  if (!project) {
    return { error: "Project not found" };
  }
  const typeMap: Record<string, ContentOutputType> = {
    hook: "hooks",
    script: "script",
    description: "description",
    hashtags: "hashtags",
  };
  const outputType = typeMap[params.type];
  if (!outputType) {
    return { error: "Unsupported node type for generation" };
  }
  const channelWithBuckets = await getChannelWithBuckets(channel.id);
  const buckets = channelWithBuckets?.buckets ?? [];
  const channelContext = buildContext({
    channelName: channel.name,
    coreAudience: channel.coreAudience,
    goals: channel.goals,
    buckets: buckets.map((b: { name: string; description: string | null }) => ({
      name: b.name,
      description: b.description,
    })),
  });
  const hookSample =
    outputType === "hooks" ? await getHookInspirationSample() : undefined;
  try {
    const content = await generateContentOutput({
      channelContext,
      ideaContent: params.contextContent,
      type: outputType,
      hookInspirationSample: hookSample,
    });
    return { success: true, content };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to generate",
    };
  }
}
