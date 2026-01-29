"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles, Lightbulb, ArrowRight } from "lucide-react";
import { queryKeys } from "@/lib/query-keys";
import { fetchApi } from "@/lib/fetch-api";
import { useRedirectOnUnauthorized } from "@/lib/use-redirect-unauthorized";

type Channel = {
  id: string;
  name: string;
  coreAudience: string | null;
  goals: string | null;
};

type Idea = {
  id: string;
  content: string;
  createdAt: string;
};

type DashboardData = {
  channel: Channel | null;
  recentIdeas: Idea[];
};

export default function DashboardPage() {
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.me.dashboard(),
    queryFn: () => fetchApi<DashboardData>("/api/me/dashboard"),
  });

  useRedirectOnUnauthorized(isError, error ?? null);

  const channel = data?.channel ?? null;
  const recentIdeas = data?.recentIdeas ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-semibold">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Generate ideas and create content that stays on-brand.
        </p>
      </header>

      {!channel ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Set up your channel</CardTitle>
            <CardDescription>
              Create your channel profile (name, audience, goals, buckets) so
              Co-Creator can generate consistent, on-brand content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/channel">
                Set up channel
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                Generate new idea
              </CardTitle>
              <CardDescription>
                Get AI-generated ideas based on your channel, buckets, and past
                content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg">
                <Link href="/dashboard/ideas/new">
                  <Lightbulb className="size-4" />
                  Generate idea
                </Link>
              </Button>
            </CardContent>
          </Card>

          <section>
            <h2 className="font-heading mb-4 text-xl font-semibold">
              Recent ideas
            </h2>
            {recentIdeas.length === 0 ? (
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
              <ul className="flex flex-col gap-3">
                {recentIdeas.map((idea) => (
                  <li key={idea.id}>
                    <Link href={`/dashboard/ideas/${idea.id}`}>
                      <Card className="transition-colors hover:bg-muted/50">
                        <CardContent className="p-4">
                          <p className="line-clamp-2 text-sm">
                            {idea.content}
                          </p>
                          <p className="text-muted-foreground mt-1 text-xs">
                            {new Date(idea.createdAt).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
