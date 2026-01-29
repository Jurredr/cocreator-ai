/**
 * Types for the idea/project graph (React Flow).
 * Node types represent steps: idea → sub-ideas → hook → script → description/hashtags.
 */

export const IDEA_NODE_TYPES = [
  "idea",
  "subIdea",
  "hook",
  "script",
  "description",
  "hashtags",
] as const;

export type IdeaNodeType = (typeof IDEA_NODE_TYPES)[number];

export const STEP_ORDER: IdeaNodeType[] = [
  "idea",
  "subIdea",
  "hook",
  "script",
  "description",
  "hashtags",
];

export type IdeaNodeData = {
  content: string;
  label?: string;
  /** Called when user edits content; canvas passes this to sync to state. */
  onContentChange?: (nodeId: string, content: string) => void;
};

/** Serializable shape stored in ideas.graph_data */
export type IdeaGraphData = {
  nodes: Array<{
    id: string;
    type: IdeaNodeType;
    position: { x: number; y: number };
    data: IdeaNodeData;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
};

export const NODE_LABELS: Record<IdeaNodeType, string> = {
  idea: "Idea",
  subIdea: "Sub-idea",
  hook: "Hook",
  script: "Script",
  description: "Description",
  hashtags: "Hashtags",
};
