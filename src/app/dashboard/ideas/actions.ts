"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ideas, contentOutputs } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  buildContext,
  generateIdeas as generateIdeasAI,
  generateContentOutput,
} from "@/lib/openai";
import { getChannelByUserId, getChannelWithBuckets } from "@/lib/db/queries";
import { getHookInspirationSample } from "@/lib/hooks-file";
import type { ContentOutputType } from "@/lib/db/schema";

export async function generateAndSaveIdeas(_formData: FormData): Promise<
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
  const recentIdeas = await db
    .select({ content: ideas.content })
    .from(ideas)
    .where(eq(ideas.channelId, channel.id))
    .orderBy(desc(ideas.createdAt))
    .limit(5);
  const recentScripts = await db
    .select({ content: contentOutputs.content })
    .from(contentOutputs)
    .innerJoin(ideas, eq(ideas.id, contentOutputs.ideaId))
    .where(eq(ideas.channelId, channel.id))
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
    });
    const ideaIds: string[] = [];
    for (const content of generated) {
      if (!content?.trim()) continue;
      const [inserted] = await db
        .insert(ideas)
        .values({
          channelId: channel.id,
          content: content.trim(),
        })
        .returning({ id: ideas.id });
      if (inserted) ideaIds.push(inserted.id);
    }
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/ideas");
    return { success: true, ideaIds };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to generate ideas",
    };
  }
}

export async function saveIdea(formData: FormData): Promise<
  { error: string } | { success: true; ideaId: string }
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
    return { error: "Idea content is required" };
  }
  const [inserted] = await db
    .insert(ideas)
    .values({
      channelId: channel.id,
      bucketId: bucketId || undefined,
      content,
    })
    .returning({ id: ideas.id });
  if (!inserted) {
    return { error: "Failed to save idea" };
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/ideas");
  revalidatePath(`/dashboard/ideas/${inserted.id}`);
  return { success: true, ideaId: inserted.id };
}

export async function generateOutput(
  ideaId: string,
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
  const [idea] = await db
    .select()
    .from(ideas)
    .where(and(eq(ideas.id, ideaId), eq(ideas.channelId, channel.id)))
    .limit(1);
  if (!idea) {
    return { error: "Idea not found" };
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
      ideaContent: idea.content,
      type,
      hookInspirationSample: hookSample,
    });
    await db.insert(contentOutputs).values({
      ideaId: idea.id,
      type,
      content: generatedContent,
    });
    revalidatePath(`/dashboard/ideas/${ideaId}`);
    return { success: true, content: generatedContent };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to generate",
    };
  }
}
