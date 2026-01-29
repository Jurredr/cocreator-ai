"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddPublishedContentForm } from "@/components/add-published-content-form";
import { PublishedContentList } from "@/components/published-content-list";
import { BarChart3 } from "lucide-react";
import { queryKeys } from "@/lib/query-keys";
import { fetchApi } from "@/lib/fetch-api";
import { useRedirectOnUnauthorized } from "@/lib/use-redirect-unauthorized";
import type { PublishedContentListItem } from "@/components/published-content-list";

type PerformanceData = {
  items: PublishedContentListItem[];
};

export default function PerformancePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.me.performance(),
    queryFn: () => fetchApi<PerformanceData>("/api/me/performance"),
  });

  useRedirectOnUnauthorized(isError, error ?? null);

  useEffect(() => {
    if (isError && error && (error as Error & { status?: number }).status === 400) {
      router.replace("/dashboard");
    }
  }, [isError, error, router]);

  const invalidatePerformance = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.me.performance() });
  };

  const items = data?.items ?? [];

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
          Performance
        </h1>
        <p className="text-muted-foreground mt-1">
          Link published content and add manual metrics. Data model is ready for
          future API integrations.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <BarChart3 className="size-5" />
            Add published content
          </CardTitle>
          <CardDescription>
            Platform, URL, and optional metrics (views, likes, etc.). You can
            link to an idea if this content came from one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddPublishedContentForm onSuccess={invalidatePerformance} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Published content</CardTitle>
          <CardDescription>
            Your linked posts and their metrics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PublishedContentList items={items} onSuccess={invalidatePerformance} />
        </CardContent>
      </Card>
    </div>
  );
}
