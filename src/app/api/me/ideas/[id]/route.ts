import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getChannelByUserId } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { ideas, contentOutputs } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { ContentOutputType } from "@/lib/db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ideaId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const channel = await getChannelByUserId(user.id);
  if (!channel) {
    return NextResponse.json(
      { error: "Create a channel first" },
      { status: 400 }
    );
  }
  const [idea] = await db
    .select()
    .from(ideas)
    .where(and(eq(ideas.id, ideaId), eq(ideas.channelId, channel.id)))
    .limit(1);
  if (!idea) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const outputs = await db
    .select()
    .from(contentOutputs)
    .where(eq(contentOutputs.ideaId, idea.id))
    .orderBy(desc(contentOutputs.createdAt));

  const byType = outputs.reduce(
    (acc, o) => {
      acc[o.type] = o.content;
      return acc;
    },
    {} as Record<ContentOutputType, string>
  );

  return NextResponse.json({
    idea: {
      id: idea.id,
      content: idea.content,
      createdAt: idea.createdAt,
    },
    byType,
  });
}
