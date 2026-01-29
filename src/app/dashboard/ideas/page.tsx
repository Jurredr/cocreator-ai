import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getChannelByUserId } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { ideas } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

export default async function IdeasPage() {
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
  const ideaList = await db
    .select()
    .from(ideas)
    .where(eq(ideas.channelId, channel.id))
    .orderBy(desc(ideas.createdAt))
    .limit(50);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Ideas
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate and manage content ideas.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/ideas/new">
            <Lightbulb className="size-4" />
            Generate idea
          </Link>
        </Button>
      </header>

      <ul className="flex flex-col gap-3">
        {ideaList.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4 text-center">
                No ideas yet. Generate your first idea to get started.
              </p>
              <Button asChild>
                <Link href="/dashboard/ideas/new">Generate idea</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          ideaList.map((idea) => (
            <li key={idea.id}>
              <Link href={`/dashboard/ideas/${idea.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="p-4">
                    <p className="line-clamp-2 text-sm">{idea.content}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {new Date(idea.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
