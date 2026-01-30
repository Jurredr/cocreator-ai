"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Trash2, LayoutGrid } from "lucide-react";
import { queryKeys } from "@/lib/query-keys";
import { fetchApi } from "@/lib/fetch-api";
import { useRedirectOnUnauthorized } from "@/lib/use-redirect-unauthorized";
import { deleteProject, createEmptyProject } from "@/app/dashboard/ideas/actions";
import { toast } from "sonner";
import type { ProjectStatus, ProjectContentType } from "@/lib/db/schema";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  idea: "Idea",
  scripting: "Scripting",
  producing: "Producing",
  uploaded: "Uploaded",
};

const CONTENT_TYPE_LABELS: Record<ProjectContentType, string> = {
  "short-form": "Short-form",
  "long-form": "Long-form",
  textual: "Textual",
};

type Project = {
  id: string;
  content: string;
  status: ProjectStatus;
  contentType?: ProjectContentType;
  createdAt: string;
};

type ProjectsData = {
  projects: Project[];
};

export default function ProjectsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.me.projects(),
    queryFn: () => fetchApi<ProjectsData>("/api/me/projects"),
  });

  useRedirectOnUnauthorized(isError, error ?? null);

  const projectList = data?.projects ?? [];

  async function handleNewProject() {
    setCreating(true);
    try {
      const result = await createEmptyProject();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.me.projects() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.me.dashboard() });
      toast.success("Project created");
      router.push(`/dashboard/projects/${result.projectId}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(projectId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this project? This cannot be undone.")) return;

    const key = queryKeys.me.projects();
    const previous = queryClient.getQueryData<ProjectsData>(key);
    queryClient.setQueryData<ProjectsData>(key, (old) =>
      old
        ? { ...old, projects: (old.projects ?? []).filter((p) => p.id !== projectId) }
        : old
    );

    const result = await deleteProject(projectId);
    if (result && "error" in result) {
      queryClient.setQueryData(key, previous);
      toast.error(result.error);
      return;
    }
    toast.success("Project deleted");
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold">
            Projects
          </h1>
          <p className="text-muted-foreground mt-1">
            Each project is a canvas: from idea to script, hook, description, and hashtags.
          </p>
        </div>
        <Button onClick={handleNewProject} disabled={creating}>
          <Plus className="size-4" />
          New project
        </Button>
      </header>

      {projectList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4 text-center">
              No projects yet. Create a project to open the canvas and build from idea to script.
            </p>
            <Button onClick={handleNewProject} disabled={creating}>
              New project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projectList.map((project) => (
            <li key={project.id} className="list-none">
              <Card className="group relative transition-colors hover:bg-muted/50">
                <CardContent className="p-4">
                  <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={(e) => e.preventDefault()}
                          aria-label="Open menu"
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => handleDelete(project.id, e)}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="block pr-8"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize bg-muted/80">
                        {STATUS_LABELS[project.status]}
                      </span>
                      <span className="text-muted-foreground rounded border px-2 py-0.5 text-xs">
                        {CONTENT_TYPE_LABELS[project.contentType ?? "short-form"]}
                      </span>
                    </div>
                    <p className="line-clamp-3 text-sm">
                      {project.content?.trim() || "Untitled project"}
                    </p>
                    <p className="text-muted-foreground mt-2 text-xs flex items-center gap-1">
                      <LayoutGrid className="size-3" />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </Link>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
