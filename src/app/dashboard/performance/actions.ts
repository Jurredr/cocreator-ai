"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { publishedContent } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getChannelByUserId } from "@/lib/db/queries";

const PLATFORMS = ["tiktok", "instagram", "youtube"] as const;
type Platform = (typeof PLATFORMS)[number];

function parsePlatform(s: string): Platform | null {
  if (PLATFORMS.includes(s as Platform)) return s as Platform;
  return null;
}

export async function addPublishedContent(formData: FormData): Promise<
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
  const platform = parsePlatform((formData.get("platform") as string) ?? "");
  const url = (formData.get("url") as string)?.trim();
  const projectId = (formData.get("projectId") as string)?.trim() || null;
  if (!platform || !url) {
    return { error: "Platform and URL are required" };
  }
  const views = formData.get("views");
  const likes = formData.get("likes");
  const comments = formData.get("comments");
  const shares = formData.get("shares");
  const publishedAtStr = (formData.get("publishedAt") as string)?.trim();

  await db.insert(publishedContent).values({
    channelId: channel.id,
    projectId: projectId || undefined,
    platform,
    url,
    views: views ? parseInt(String(views), 10) : null,
    likes: likes ? parseInt(String(likes), 10) : null,
    comments: comments ? parseInt(String(comments), 10) : null,
    shares: shares ? parseInt(String(shares), 10) : null,
    publishedAt: publishedAtStr ? new Date(publishedAtStr) : null,
  });
  revalidatePath("/dashboard/performance");
  return { success: true };
}

export async function deletePublishedContent(id: string): Promise<
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
  await db
    .delete(publishedContent)
    .where(
      and(
        eq(publishedContent.id, id),
        eq(publishedContent.channelId, channel.id)
      )
    );
  revalidatePath("/dashboard/performance");
  return { success: true };
}
