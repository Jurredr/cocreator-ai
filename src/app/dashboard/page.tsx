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
import { fetchApi } from "@/lib/api/fetch-api";
import { queryKeys } from "@/lib/query/query-keys";
import { useRedirectOnUnauthorized } from "@/lib/hooks/use-redirect-unauthorized";

type Channel = {
  id: string;
  name: string;
  coreAudience: string | null;
  goals: string | null;
};

type Project = {
  id: string;
  content: string;
  status: string;
  createdAt: string;
};

type DashboardData = {
  channel: Channel | null;
  recentProjects: Project[];
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
  const recentProjects = data?.recentProjects ?? [];

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
                New project
              </CardTitle>
              <CardDescription>
                Open a canvas and build from idea to script with AI assistance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg">
                <Link href="/dashboard/projects">
                  <Lightbulb className="size-4" />
                  Open projects
                </Link>
              </Button>
            </CardContent>
          </Card>

          <section>
            <h2 className="font-heading mb-4 text-xl font-semibold">
              Recent projects
            </h2>
            {recentProjects.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground mb-4 text-center">
                    No projects yet. Create a project to get started.
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/projects">Open projects</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ul className="flex flex-col gap-3">
                {recentProjects.map((project) => (
                  <li key={project.id}>
                    <Link href={`/dashboard/projects/${project.id}`}>
                      <Card className="transition-colors hover:bg-muted/50">
                        <CardContent className="p-4">
                          <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize bg-muted/80 mb-2">
                            {project.status}
                          </span>
                          <p className="line-clamp-2 text-sm">
                            {project.content?.trim() || "Untitled project"}
                          </p>
                          <p className="text-muted-foreground mt-1 text-xs">
                            {new Date(project.createdAt).toLocaleDateString()}
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
