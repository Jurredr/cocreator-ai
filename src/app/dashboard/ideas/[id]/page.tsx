"use client";

import { use, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GenerateOutputButtons } from "@/components/generate-output-buttons";
import { CopyBlock } from "@/components/copy-block";
import { queryKeys } from "@/lib/query-keys";
import { fetchApi } from "@/lib/fetch-api";
import { useRedirectOnUnauthorized } from "@/lib/use-redirect-unauthorized";
import type { ContentOutputType } from "@/lib/db/schema";

const OUTPUT_LABELS: Record<ContentOutputType, string> = {
  title: "Title",
  description: "Description",
  hashtags: "Hashtags",
  script: "Script",
  hooks: "Hooks",
};

type IdeaDetailData = {
  idea: { id: string; content: string; createdAt: string };
  byType: Record<ContentOutputType, string>;
};

export default function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const queryClient = useQueryClient();
  const { id: ideaId } = use(params);

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.me.idea(ideaId),
    queryFn: () => fetchApi<IdeaDetailData>(`/api/me/ideas/${ideaId}`),
    enabled: Boolean(ideaId),
  });

  useRedirectOnUnauthorized(isError, error ?? null);

  useEffect(() => {
    if (isError && error && (error as Error & { status?: number }).status === 404) {
      notFound();
    }
  }, [isError, error]);

  const invalidateIdea = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.me.idea(ideaId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.me.ideas() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.me.dashboard() });
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-8 p-6">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { idea, byType } = data;

  return (
    <div className="flex flex-1 flex-col gap-8 p-6">
      <header>
        <h1 className="font-heading text-3xl font-semibold">
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
              <GenerateOutputButtons
                ideaId={idea.id}
                type={type}
                onSuccess={invalidateIdea}
              />
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
