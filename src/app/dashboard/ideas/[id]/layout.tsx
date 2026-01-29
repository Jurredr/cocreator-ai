import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getChannelByUserId } from "@/lib/db/queries";
import { getIdeaByIdForChannel } from "@/lib/db/queries";

const IDEA_TITLE_MAX_LENGTH = 50;

function truncateForTitle(text: string, max = IDEA_TITLE_MAX_LENGTH): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max).lastIndexOf(" ");
  return cut > 0 ? `${trimmed.slice(0, cut)}…` : `${trimmed.slice(0, max)}…`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: ideaId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { title: "Idea" };
  }
  const channel = await getChannelByUserId(user.id);
  if (!channel) {
    return { title: "Idea" };
  }
  const idea = await getIdeaByIdForChannel(ideaId, channel.id);
  if (!idea) {
    return { title: "Idea" };
  }
  const title = truncateForTitle(idea.content);
  return {
    title: title || "Idea",
    description: `Generate scripts, hooks, titles, and descriptions from this idea. Co-Creator AI keeps your channel context so every output stays on-brand.`,
  };
}

export default function IdeaDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
