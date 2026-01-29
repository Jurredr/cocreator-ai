import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getChannelByUserId, getProjectByIdForChannel } from "@/lib/db/queries";
import { pageTitle } from "@/lib/metadata";

const TITLE_MAX_LENGTH = 50;

function truncateForTitle(text: string, max = TITLE_MAX_LENGTH): string {
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
  const { id: projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { title: pageTitle("Project") };
  }
  const channel = await getChannelByUserId(user.id);
  if (!channel) {
    return { title: pageTitle("Project") };
  }
  const project = await getProjectByIdForChannel(projectId, channel.id);
  if (!project) {
    return { title: pageTitle("Project") };
  }
  const segment = truncateForTitle(project.content) || "Project";
  return {
    title: pageTitle(segment),
    description: `Build from idea to script. Co-Creator AI keeps your channel context so every output stays on-brand.`,
  };
}

export default function ProjectDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
