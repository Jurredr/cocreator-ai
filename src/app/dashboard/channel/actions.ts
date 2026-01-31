"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { channels, buckets, channelInspirationVideos } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { brainstormGoalsAndBuckets } from "@/lib/ai/openai";
import { getChannelWithBuckets, getChannelByUserId } from "@/lib/db/queries";

export async function createOrUpdateChannel(formData: FormData): Promise<
  { error: string } | { success: true }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }
  const name = (formData.get("name") as string)?.trim();
  const coreAudience = (formData.get("coreAudience") as string)?.trim() || null;
  const goals = (formData.get("goals") as string)?.trim() || null;
  const nextSequenceLabel = (formData.get("nextSequenceLabel") as string)?.trim() || null;
  if (!name) {
    return { error: "Channel name is required" };
  }
  const existing = await getChannelByUserId(user.id);
  if (existing) {
    await db
      .update(channels)
      .set({
        name,
        coreAudience,
        goals,
        nextSequenceLabel,
        updatedAt: new Date(),
      })
      .where(eq(channels.id, existing.id));
  } else {
    await db.insert(channels).values({
      userId: user.id,
      name,
      coreAudience,
      goals,
      nextSequenceLabel,
    });
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/channel");
  return { success: true };
}

export async function addBucket(formData: FormData): Promise<
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
    return { error: "Create a channel first" };
  }
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  if (!name) {
    return { error: "Bucket name is required" };
  }
  await db.insert(buckets).values({
    channelId: channel.id,
    name,
    description,
  });
  revalidatePath("/dashboard/channel");
  return { success: true };
}

export async function updateBucket(
  bucketId: string,
  formData: FormData
): Promise<{ error?: string } | { success: true }> {
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
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  if (!name) {
    return { error: "Bucket name is required" };
  }
  await db
    .update(buckets)
    .set({ name, description })
    .where(eq(buckets.id, bucketId));
  revalidatePath("/dashboard/channel");
  return { success: true };
}

export async function deleteBucket(bucketId: string): Promise<{ error?: string } | { success: true }> {
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
  await db.delete(buckets).where(eq(buckets.id, bucketId));
  revalidatePath("/dashboard/channel");
  return { success: true };
}

export async function runBrainstorm(mode: "goals" | "buckets" | "both"): Promise<{
  error?: string;
  goals?: string;
  buckets?: { name: string; description: string }[];
}> {
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
  if (!channelWithBuckets) {
    return { error: "Channel not found" };
  }
  try {
    const result = await brainstormGoalsAndBuckets({
      channelName: channelWithBuckets.name,
      coreAudience: channelWithBuckets.coreAudience,
      currentGoals: channelWithBuckets.goals,
      currentBuckets: channelWithBuckets.buckets.map((b: { name: string; description: string | null }) => ({
        name: b.name,
        description: b.description ?? "",
      })),
      mode,
    });
    return {
      goals: result.goals,
      buckets: result.buckets,
    };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Brainstorm failed",
    };
  }
}

export async function addInspirationVideo(formData: FormData): Promise<
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
    return { error: "Create a channel first" };
  }
  const url = (formData.get("url") as string)?.trim();
  const note = (formData.get("note") as string)?.trim() || null;
  if (!url) {
    return { error: "Video URL is required" };
  }
  await db.insert(channelInspirationVideos).values({
    channelId: channel.id,
    url,
    note,
  });
  revalidatePath("/dashboard/channel");
  return { success: true };
}

export async function updateInspirationVideo(
  id: string,
  formData: FormData
): Promise<{ error?: string } | { success: true }> {
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
  const url = (formData.get("url") as string)?.trim();
  const note = (formData.get("note") as string)?.trim() || null;
  if (!url) {
    return { error: "Video URL is required" };
  }
  await db
    .update(channelInspirationVideos)
    .set({ url, note })
    .where(
      and(
        eq(channelInspirationVideos.id, id),
        eq(channelInspirationVideos.channelId, channel.id)
      )
    );
  revalidatePath("/dashboard/channel");
  return { success: true };
}

export async function deleteInspirationVideo(id: string): Promise<
  { error?: string } | { success: true }
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
  await db
    .delete(channelInspirationVideos)
    .where(
      and(
        eq(channelInspirationVideos.id, id),
        eq(channelInspirationVideos.channelId, channel.id)
      )
    );
  revalidatePath("/dashboard/channel");
  return { success: true };
}
