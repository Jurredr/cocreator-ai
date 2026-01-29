"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BrollUpload } from "@/components/broll-upload";
import { BrollList } from "@/components/broll-list";
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

type BrollItem = {
  id: string;
  filename: string;
  thumbnailDataUrl: string;
  description: string | null;
};

export default function BrollPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data: items = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.broll(),
    queryFn: () => fetchApi<BrollItem[]>("/api/broll"),
  });

  useRedirectOnUnauthorized(isError, error ?? null);

  useEffect(() => {
    if (isError && error && (error as Error & { status?: number }).status === 400) {
      router.replace("/dashboard");
    }
  }, [isError, error, router]);

  const invalidateBroll = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.broll() });
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
          B-roll library
        </h1>
        <p className="text-muted-foreground mt-1">
          Add video files to extract a thumbnail and description. Videos are not
          uploaded—only a thumbnail is stored (client-side extraction).
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Add B-roll</CardTitle>
          <CardDescription>
            Select a video file. A thumbnail will be extracted in your browser
            and stored with the filename and optional description.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BrollUpload onSuccess={invalidateBroll} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Library</CardTitle>
          <CardDescription>
            Your B-roll clips. Use these when generating scripts or ideas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BrollList items={items} />
        </CardContent>
      </Card>
    </div>
  );
}
