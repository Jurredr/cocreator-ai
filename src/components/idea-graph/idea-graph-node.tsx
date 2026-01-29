"use client";

import { useCallback, useEffect, useState } from "react";
import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { NODE_LABELS, type IdeaNodeType, type IdeaNodeData } from "@/lib/idea-graph-types";
import { cn } from "@/lib/utils";

export type IdeaGraphNodeData = IdeaNodeData;

export type IdeaGraphNode = Node<IdeaGraphNodeData, IdeaNodeType>;

export type IdeaGraphNodeProps = NodeProps<IdeaGraphNode>;

export function IdeaGraphNode(props: IdeaGraphNodeProps) {
  const { id, data, type: nodeType, selected } = props;
  const [content, setContent] = useState(data.content ?? "");
  const [isBrainstorming, setIsBrainstorming] = useState(false);

  useEffect(() => {
    setContent(data.content ?? "");
    setIsBrainstorming(false);
  }, [data.content]);

  const label = NODE_LABELS[nodeType] ?? nodeType;
  const canBrainstorm = ["idea", "subIdea", "hook", "script", "description", "hashtags"].includes(nodeType);

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setContent(value);
      data.onContentChange?.(id, value);
    },
    [id, data]
  );

  const handleBrainstorm = useCallback(() => {
    if (!canBrainstorm) return;
    setIsBrainstorming(true);
    const event = new CustomEvent("idea-graph-brainstorm", { detail: { nodeId: id, currentContent: content } });
    window.dispatchEvent(event);
  }, [canBrainstorm, id, content]);

  return (
    <>
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !border-2 !bg-background" />
      <Card
        className={cn(
          "min-w-[220px] max-w-[320px] shadow-md transition-shadow",
          selected && "ring-2 ring-primary"
        )}
      >
        <CardHeader className="py-2 px-3 flex flex-row items-center justify-between space-y-0 gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
          {canBrainstorm && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 nodrag nopan"
              onClick={handleBrainstorm}
              disabled={isBrainstorming}
              aria-label="Brainstorm with AI"
            >
              {isBrainstorming ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5 text-primary" />
              )}
            </Button>
          )}
        </CardHeader>
        <CardContent className="py-0 px-3 pb-3 pt-0">
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder={`Add ${label.toLowerCase()}...`}
            className="nodrag nopan w-full min-h-[60px] resize-y rounded-md border border-input bg-transparent px-2 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            rows={2}
          />
        </CardContent>
      </Card>
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !border-2 !bg-background" />
    </>
  );
}
