import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getChannelByUserId } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { ideas, contentOutputs } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GenerateOutputButtons } from "@/components/generate-output-buttons";
import { CopyBlock } from "@/components/copy-block";
import type { ContentOutputType } from "@/lib/db/schema";

const OUTPUT_LABELS: Record<ContentOutputType, string> = {
  title: "Title",
  description: "Description",
  hashtags: "Hashtags",
  script: "Script",
  hooks: "Hooks",
};

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: ideaId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  const channel = await getChannelByUserId(user.id);
  if (!channel) {
    redirect("/dashboard");
  }
  const [idea] = await db
    .select()
    .from(ideas)
    .where(and(eq(ideas.id, ideaId), eq(ideas.channelId, channel.id)))
    .limit(1);
  if (!idea) {
    notFound();
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

  return (
    <div className="flex flex-1 flex-col gap-8 p-6">
      <header>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Idea
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate title, description, hashtags, script, and hooks from this
          idea.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Idea</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{idea.content}</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {(
          ["title", "description", "hashtags", "script", "hooks"] as const
        ).map((type) => (
          <Card key={type}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-heading text-base">
                {OUTPUT_LABELS[type]}
              </CardTitle>
              <GenerateOutputButtons ideaId={idea.id} type={type} />
            </CardHeader>
            <CardContent>
              {byType[type] ? (
                <CopyBlock content={byType[type]} />
              ) : (
                <p className="text-muted-foreground text-sm">
                  Not generated yet. Click &quot;Generate&quot; to create.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
