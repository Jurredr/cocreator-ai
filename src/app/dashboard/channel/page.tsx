"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChannelForm } from "@/components/channel-form";
import { BucketList } from "@/components/bucket-list";
import { InspirationVideosList } from "@/components/inspiration-videos-list";
import { BrainstormBlock } from "@/components/brainstorm-block";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchApi } from "@/lib/api/fetch-api";
import { queryKeys } from "@/lib/query/query-keys";
import { useRedirectOnUnauthorized } from "@/lib/hooks/use-redirect-unauthorized";

type Channel = {
  id: string;
  name: string;
  coreAudience: string | null;
  goals: string | null;
};

type Bucket = {
  id: string;
  name: string;
  description: string | null;
};

type InspirationVideo = {
  id: string;
  url: string;
  note: string | null;
};

type ChannelWithBuckets = {
  id: string;
  name: string;
  coreAudience: string | null;
  goals: string | null;
  buckets: Bucket[];
  inspirationVideos: InspirationVideo[];
};

type ChannelData = {
  channel: Channel | null;
  channelWithBuckets: ChannelWithBuckets | null;
};

export default function ChannelPage() {
  const queryClient = useQueryClient();
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.me.channel(),
    queryFn: () => fetchApi<ChannelData>("/api/me/channel"),
  });

  useRedirectOnUnauthorized(isError, error ?? null);

  const channel = data?.channel ?? null;
  const channelWithBuckets = data?.channelWithBuckets ?? null;

  const invalidateChannel = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.me.channel() });
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-8 p-6">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-6">
      <header>
        <h1 className="font-heading text-3xl font-semibold">
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
          <ChannelForm channel={channel ?? undefined} onSuccess={invalidateChannel} />
        </CardContent>
      </Card>

      {channel && (
        <>
          <BrainstormBlock
            channelName={channel.name}
            coreAudience={channel.coreAudience}
            goals={channel.goals}
            buckets={
              channelWithBuckets?.buckets.map((b) => ({
                name: b.name,
                description: b.description ?? "",
              })) ?? []
            }
          />
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Inspiration videos</CardTitle>
              <CardDescription>
                Video links that inspire the general vibe of your channel. Add a
                note on what you like about each one.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InspirationVideosList
                videos={channelWithBuckets?.inspirationVideos ?? []}
                channelId={channel.id}
                onSuccess={invalidateChannel}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Content buckets</CardTitle>
              <CardDescription>
                Themes or series for your content. Ideas can be associated with
                a bucket.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BucketList
                buckets={channelWithBuckets?.buckets ?? []}
                channelId={channel.id}
                onSuccess={invalidateChannel}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
