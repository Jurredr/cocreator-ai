import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getChannelByUserId, getChannelWithBuckets } from "@/lib/db/queries";
import { ChannelForm } from "@/components/channel-form";
import { BucketList } from "@/components/bucket-list";
import { BrainstormBlock } from "@/components/brainstorm-block";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ChannelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  const channel = await getChannelByUserId(user.id);
  const channelWithBuckets = channel
    ? await getChannelWithBuckets(channel.id)
    : null;

  return (
    <div className="flex flex-1 flex-col gap-8 p-6">
      <header>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Channel profile
        </h1>
        <p className="text-muted-foreground mt-1">
          Define your channel name, audience, goals, and content buckets so
          Co-Creator can generate on-brand content.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Channel</CardTitle>
          <CardDescription>
            Name, core audience, and goals. AI can help brainstorm these below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChannelForm channel={channel ?? undefined} />
        </CardContent>
      </Card>

      {channel && (
        <>
          <BrainstormBlock
            channelName={channel.name}
            coreAudience={channel.coreAudience}
            goals={channel.goals}
            buckets={
              channelWithBuckets?.buckets.map((b: { name: string; description: string | null }) => ({
                name: b.name,
                description: b.description ?? "",
              })) ?? []
            }
          />
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Content buckets</CardTitle>
              <CardDescription>
                Themes or series for your content. Ideas can be associated with a
                bucket.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BucketList
                buckets={channelWithBuckets?.buckets ?? []}
                channelId={channel.id}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
