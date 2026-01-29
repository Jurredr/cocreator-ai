import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { broll } from "@/lib/db/schema";
import { getChannelByUserId } from "@/lib/db/queries";
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
    return NextResponse.json(
      { error: "Create a channel first" },
      { status: 400 }
    );
  }
  const list = await db
    .select()
    .from(broll)
    .where(eq(broll.channelId, channel.id))
    .orderBy(desc(broll.createdAt));
  return NextResponse.json(list);
}

export async function POST(request: Request) {
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
  const body = (await request.json()) as {
    filename: string;
    thumbnailDataUrl: string;
    description?: string;
    recordingDate?: string | null;
  };
  const { filename, thumbnailDataUrl, description, recordingDate } = body;
  if (!filename || !thumbnailDataUrl) {
    return NextResponse.json(
      { error: "filename and thumbnailDataUrl required" },
      { status: 400 }
    );
  }
  const [inserted] = await db
    .insert(broll)
    .values({
      channelId: channel.id,
      filename,
      thumbnailDataUrl,
      description: description ?? null,
      recordingDate: recordingDate ? new Date(recordingDate) : null,
    })
    .returning();
  if (!inserted) {
    return NextResponse.json(
      { error: "Failed to save" },
      { status: 500 }
    );
  }
  return NextResponse.json(inserted);
}
