import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getChannelByUserId } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { projects, contentOutputs } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { ContentOutputType } from "@/lib/db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
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
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.channelId, channel.id)))
    .limit(1);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const outputs = await db
    .select()
    .from(contentOutputs)
    .where(eq(contentOutputs.projectId, project.id))
    .orderBy(desc(contentOutputs.createdAt));

  const byType = outputs.reduce(
    (acc, o) => {
      acc[o.type] = o.content;
      return acc;
    },
    {} as Record<ContentOutputType, string>
  );

  return NextResponse.json({
    project: {
      id: project.id,
      content: project.content,
      graphData: project.graphData ?? null,
      status: project.status,
      createdAt: project.createdAt,
    },
    byType,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
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
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.channelId, channel.id)))
    .limit(1);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  let body: { graph_data?: unknown; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const updates: { graphData?: unknown; status?: "idea" | "scripting" | "producing" | "uploaded" } = {};
  if (body.graph_data !== undefined) updates.graphData = body.graph_data;
  if (body.status !== undefined) {
    if (["idea", "scripting", "producing", "uploaded"].includes(body.status)) {
      updates.status = body.status as "idea" | "scripting" | "producing" | "uploaded";
    }
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Provide graph_data and/or status" }, { status: 400 });
  }
  await db
    .update(projects)
    .set(updates)
    .where(eq(projects.id, projectId));
  return NextResponse.json({ ok: true });
}
