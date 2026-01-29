"use client";

import { Panel } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Lightbulb, MessageSquare, FileText, Hash, AlignLeft, Trash2 } from "lucide-react";
import type { IdeaNodeType } from "@/lib/idea-graph-types";
import { NODE_LABELS } from "@/lib/idea-graph-types";

type CanvasToolbarProps = {
  selectedNodeId: string | null;
  selectedNodeType: IdeaNodeType | null;
  selectedNodeContent: string;
  hasSelection: boolean;
  onAddIdea: () => void;
  onGenerateThreeIdeas: () => void;
  onAddSubIdeas: () => void;
  onAddNextStep: (type: IdeaNodeType) => void;
  onDeleteSelected: () => void;
  isAddingIdea?: boolean;
  isGenerating?: boolean;
  isBrainstormingSubIdeas?: boolean;
};

const NEXT_STEPS: IdeaNodeType[] = ["hook", "script", "description", "hashtags"];

export function CanvasToolbar({
  selectedNodeId,
  selectedNodeType,
  selectedNodeContent,
  hasSelection,
  onAddIdea,
  onGenerateThreeIdeas,
  onAddSubIdeas,
  onAddNextStep,
  onDeleteSelected,
  isAddingIdea,
  isGenerating,
  isBrainstormingSubIdeas,
}: CanvasToolbarProps) {
  const canAddSubIdeas =
    selectedNodeId &&
    (selectedNodeType === "idea" || selectedNodeType === "subIdea");
  const canAddNextStep = selectedNodeId && selectedNodeType !== "hashtags";

  return (
    <Panel position="top-left" className="flex flex-wrap items-center gap-2 m-4">
      <div className="flex items-center gap-2 rounded-lg border bg-background/95 p-2 shadow-sm backdrop-blur">
        <Button
          variant="outline"
          size="sm"
          onClick={onAddIdea}
          disabled={isAddingIdea}
          className="gap-1.5"
        >
          <Plus className="size-3.5" />
          Add idea
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onGenerateThreeIdeas}
          disabled={isGenerating}
          className="gap-1.5"
        >
          <Sparkles className="size-3.5" />
          Generate 3 ideas
        </Button>
        {hasSelection && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDeleteSelected}
            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        )}
      </div>
      {canAddSubIdeas && (
        <div className="flex items-center gap-2 rounded-lg border bg-background/95 p-2 shadow-sm backdrop-blur">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddSubIdeas}
            disabled={isBrainstormingSubIdeas || !selectedNodeContent.trim()}
            className="gap-1.5"
          >
            <Lightbulb className="size-3.5" />
            Brainstorm sub-ideas
          </Button>
        </div>
      )}
      {canAddNextStep && (
        <div className="flex items-center gap-1 rounded-lg border bg-background/95 p-2 shadow-sm backdrop-blur">
          <span className="text-muted-foreground mr-1 text-xs font-medium">Next step:</span>
          {NEXT_STEPS.filter((t) => t !== selectedNodeType).map((type) => (
            <Button
              key={type}
              variant="ghost"
              size="sm"
              onClick={() => onAddNextStep(type)}
              className="gap-1 h-8 text-xs"
            >
              {type === "hook" && <MessageSquare className="size-3" />}
              {type === "script" && <FileText className="size-3" />}
              {type === "description" && <AlignLeft className="size-3" />}
              {type === "hashtags" && <Hash className="size-3" />}
              {NODE_LABELS[type]}
            </Button>
          ))}
        </div>
      )}
    </Panel>
  );
}
