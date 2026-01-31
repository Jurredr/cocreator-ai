/**
 * Types for the idea/project graph (React Flow).
 * "Core" ideas start the flow; ideaBlock nodes provide context for hook/script generation.
 */

export const IDEA_NODE_TYPES = [
  "idea",
  "subIdea",
  "hook",
  "script",
  "description",
  "hashtags",
  "ideaBlock",
] as const;

export type IdeaNodeType = (typeof IDEA_NODE_TYPES)[number];

/** Steps that can be added as follow-ups from the toolbar (not ideaBlock). */
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
  /** For script nodes: when true, title/description/hashtags can be generated from this script. */
  ready?: boolean;
  /** When true, the node's input is read-only (e.g. after generating from it, or generated hook). */
  inputDisabled?: boolean;
  /** Runtime only: show loading state while generating. */
  loading?: boolean;
  /** Script node: three sections. When set, script node shows hook / body / end boxes. */
  scriptHook?: string;
  scriptBody?: string;
  scriptEnd?: string;
  /** Script node: when true, hook field is read-only (e.g. script was created from a hook node). */
  hookLocked?: boolean;
  /** Called when user edits content; canvas passes this to sync to state. */
  onContentChange?: (nodeId: string, content: string) => void;
  onScriptChange?: (nodeId: string, section: "hook" | "body" | "end", value: string) => void;
  onReadyChange?: (nodeId: string, ready: boolean) => void;
};

/** Serializable shape stored in ideas.graph_data (callbacks and loading are runtime-only). */
export type IdeaGraphData = {
  nodes: Array<{
    id: string;
    type: IdeaNodeType;
    position: { x: number; y: number };
    data: Pick<IdeaNodeData, "content" | "label" | "ready" | "inputDisabled" | "scriptHook" | "scriptBody" | "scriptEnd" | "hookLocked">;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
};

export const NODE_LABELS: Record<IdeaNodeType, string> = {
  idea: "Core idea",
  subIdea: "Sub-idea",
  hook: "Hook",
  script: "Script",
  description: "Description",
  hashtags: "Hashtags",
  ideaBlock: "Idea for this",
};

/** Node types that can have AI generation (hook, script, description, hashtags). */
export const GENERATABLE_TYPES: IdeaNodeType[] = ["hook", "script", "description", "hashtags"];
