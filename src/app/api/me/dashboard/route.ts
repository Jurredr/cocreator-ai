import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getChannelByUserId, getRecentIdeas } from "@/lib/db/queries";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const channel = await getChannelByUserId(user.id);
  const recentIdeas = channel
    ? await getRecentIdeas(channel.id, 5)
    : [];
  return NextResponse.json({ channel, recentIdeas });
}
