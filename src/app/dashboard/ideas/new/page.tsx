"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { GenerateIdeasForm } from "@/components/generate-ideas-form";
import { SaveIdeaForm } from "@/components/save-idea-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { queryKeys } from "@/lib/query-keys";
import { fetchApi } from "@/lib/fetch-api";
import { useRedirectOnUnauthorized } from "@/lib/use-redirect-unauthorized";

type Bucket = { id: string; name: string };

type ChannelData = {
  channel: { id: string } | null;
  channelWithBuckets: { id: string; buckets: Bucket[] } | null;
};

export default function NewIdeaPage() {
  const router = useRouter();
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

  useEffect(() => {
    if (data && !data.channel) {
      router.replace("/dashboard");
    }
  }, [data, router]);

  const channelWithBuckets = data?.channelWithBuckets ?? null;
  const buckets = channelWithBuckets?.buckets ?? [];

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
          Generate idea
        </h1>
        <p className="text-muted-foreground mt-1">
          Get AI-generated ideas based on your channel and buckets, or add your
          own idea. You can focus on a bucket or give a rough idea for the AI to
          refine.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">AI-generated ideas</CardTitle>
          <CardDescription>
            Optionally pick a bucket and/or type a rough idea. Click to generate
            ideas—pick one to save or refine below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GenerateIdeasForm buckets={buckets} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Add your own idea</CardTitle>
          <CardDescription>
            Write an idea and save it to generate title, description, hashtags,
            script, and hooks from it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SaveIdeaForm />
        </CardContent>
      </Card>
    </div>
  );
}
