"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Lightbulb, MoreVertical, Trash2 } from "lucide-react";
import { queryKeys } from "@/lib/query-keys";
import { fetchApi } from "@/lib/fetch-api";
import { useRedirectOnUnauthorized } from "@/lib/use-redirect-unauthorized";
import { deleteIdea } from "@/app/dashboard/ideas/actions";
import { toast } from "sonner";

type Idea = {
  id: string;
  content: string;
  createdAt: string;
};

type IdeasData = {
  ideas: Idea[];
};

export default function IdeasPage() {
  const queryClient = useQueryClient();
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.me.ideas(),
    queryFn: () => fetchApi<IdeasData>("/api/me/ideas"),
  });

  useRedirectOnUnauthorized(isError, error ?? null);

  const ideas = data?.ideas ?? [];

  async function handleDelete(ideaId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this idea? This cannot be undone.")) return;

    const key = queryKeys.me.ideas();
    const previous = queryClient.getQueryData<IdeasData>(key);
    queryClient.setQueryData<IdeasData>(key, (old) =>
      old
        ? { ...old, ideas: (old.ideas ?? []).filter((i) => i.id !== ideaId) }
        : old
    );

    const result = await deleteIdea(ideaId);
    if (result && "error" in result) {
      queryClient.setQueryData(key, previous);
      toast.error(result.error);
      return;
    }
    toast.success("Idea deleted");
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

      {ideas.length === 0 ? (
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
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <li key={idea.id} className="list-none">
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
                          onClick={(e) => handleDelete(idea.id, e)}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Link
                    href={`/dashboard/ideas/${idea.id}`}
                    className="block pr-8"
                  >
                    <p className="line-clamp-3 text-sm">{idea.content}</p>
                    <p className="text-muted-foreground mt-2 text-xs">
                      {new Date(idea.createdAt).toLocaleDateString()}
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
