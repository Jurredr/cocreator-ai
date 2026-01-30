import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { broll } from "@/lib/db/schema";
import { getChannelByUserId } from "@/lib/db/queries";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    filename?: string;
    description?: string;
    recordingDate?: string | null;
    orientation?: "vertical" | "horizontal" | null;
  };
  const [updated] = await db
    .update(broll)
    .set({
      ...(body.filename !== undefined && { filename: body.filename }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.recordingDate !== undefined && {
        recordingDate: body.recordingDate ? new Date(body.recordingDate) : null,
      }),
      ...(body.orientation !== undefined && {
        orientation: body.orientation ?? null,
      }),
    })
    .where(and(eq(broll.id, id), eq(broll.channelId, channel.id)))
    .returning();
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
  const [deleted] = await db
    .delete(broll)
    .where(and(eq(broll.id, id), eq(broll.channelId, channel.id)))
    .returning({ id: broll.id });
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
