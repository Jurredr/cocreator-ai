"use client";

import { use, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { IdeaCanvas } from "@/components/idea-graph/idea-canvas";
import { queryKeys } from "@/lib/query-keys";
import { fetchApi } from "@/lib/fetch-api";
import { useRedirectOnUnauthorized } from "@/lib/use-redirect-unauthorized";
import type { IdeaGraphData } from "@/lib/idea-graph-types";
import {
  brainstormNoteForNode,
  brainstormSubIdeasForNode,
  generateNodeContentForNode,
  generateIdeasForCanvas,
} from "@/app/dashboard/ideas/actions";
import { toast } from "sonner";

type ProjectDetailData = {
  project: {
    id: string;
    content: string;
    graphData: IdeaGraphData | null;
    status: string;
    createdAt: string;
  };
};

function generateNodeId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ProjectCanvasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const queryClient = useQueryClient();
  const { id: projectId } = use(params);

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.me.project(projectId),
    queryFn: () => fetchApi<ProjectDetailData>(`/api/me/projects/${projectId}`),
    enabled: Boolean(projectId),
  });

  useRedirectOnUnauthorized(isError, error ?? null);

  useEffect(() => {
    if (isError && error && (error as Error & { status?: number }).status === 404) {
      notFound();
    }
  }, [isError, error]);

  const initialGraph: IdeaGraphData | null = (() => {
    if (!data?.project) return null;
    const g = data.project.graphData;
    if (g?.nodes?.length) return g;
    if (data.project.content?.trim()) {
      return {
        nodes: [
          {
            id: generateNodeId(),
            type: "idea",
            position: { x: 80, y: 80 },
            data: { content: data.project.content },
          },
        ],
        edges: [],
      };
    }
    return null;
  })();

  const handleSaveGraph = async (_projectId: string, graph: IdeaGraphData) => {
    try {
      await fetchApi(`/api/me/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ graph_data: graph }),
      });
      queryClient.setQueryData(queryKeys.me.project(projectId), (old: ProjectDetailData | undefined) =>
        old ? { ...old, project: { ...old.project, graphData: graph } } : old
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const handleBrainstormNote = async (params: {
    nodeId: string;
    currentContent: string;
  }): Promise<string> => {
    const result = await brainstormNoteForNode({
      projectId,
      nodeId: params.nodeId,
      currentContent: params.currentContent,
    });
    if ("error" in result) {
      toast.error(result.error);
      throw new Error(result.error);
    }
    return result.content;
  };

  const handleBrainstormSubIdeas = async (params: {
    parentContent: string;
  }): Promise<string[]> => {
    const result = await brainstormSubIdeasForNode({
      projectId,
      parentContent: params.parentContent,
      count: 4,
    });
    if ("error" in result) {
      toast.error(result.error);
      return [];
    }
    return result.ideas;
  };

  const handleGenerateNodeContent = async (params: {
    type: import("@/lib/idea-graph-types").IdeaNodeType;
    contextContent: string;
  }): Promise<string> => {
    const result = await generateNodeContentForNode({
      projectId,
      type: params.type,
      contextContent: params.contextContent,
    });
    if ("error" in result) {
      toast.error(result.error);
      return "";
    }
    return result.content;
  };

  const handleGenerateThreeIdeas = async (): Promise<string[]> => {
    const result = await generateIdeasForCanvas({ projectId, count: 3 });
    if ("error" in result) {
      toast.error(result.error);
      return [];
    }
    return result.ideas;
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-8 p-6">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="h-[60vh] animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <header>
        <h1 className="font-heading text-3xl font-semibold">
          Project canvas
        </h1>
        <p className="text-muted-foreground mt-1">
          Build your idea step by step: add or generate ideas, brainstorm sub-ideas, then add hook, script, description, and hashtags. AI assists at each step.
        </p>
      </header>
      <div className="flex-1 min-h-[500px] rounded-lg border bg-muted/30">
        <IdeaCanvas
          initialGraph={initialGraph}
          ideaId={projectId}
          onSaveGraph={handleSaveGraph}
          onBrainstormNote={handleBrainstormNote}
          onBrainstormSubIdeas={handleBrainstormSubIdeas}
          onGenerateNodeContent={handleGenerateNodeContent}
          onGenerateThreeIdeas={handleGenerateThreeIdeas}
          className="h-full min-h-[500px]"
        />
      </div>
    </div>
  );
}
