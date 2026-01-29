import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getChannelByUserId } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { ideas } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const channel = await getChannelByUserId(user.id);
  if (!channel) {
    return NextResponse.json({ ideas: [] });
  }
  const ideaList = await db
    .select()
    .from(ideas)
    .where(eq(ideas.channelId, channel.id))
    .orderBy(desc(ideas.createdAt))
    .limit(50);
  return NextResponse.json({ ideas: ideaList });
}
