import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getChannelByUserId, getChannelWithBuckets } from "@/lib/db/queries";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const channel = await getChannelByUserId(user.id);
  const channelWithBuckets = channel
    ? await getChannelWithBuckets(channel.id)
    : null;
  return NextResponse.json({ channel, channelWithBuckets });
}
