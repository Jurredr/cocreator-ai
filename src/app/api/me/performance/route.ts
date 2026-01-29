import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  getChannelByUserId,
  getPublishedContentByChannelId,
} from "@/lib/db/queries";

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
    return NextResponse.json(
      { error: "Create a channel first" },
      { status: 400 }
    );
  }
  const items = await getPublishedContentByChannelId(channel.id);
  return NextResponse.json({ items });
}
