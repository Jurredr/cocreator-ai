"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  useOnSelectionChange,
  type Connection,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { IdeaGraphNode } from "./idea-graph-node";
import { CanvasToolbar } from "./canvas-toolbar";
import type { IdeaGraphData, IdeaNodeType, IdeaNodeData } from "@/lib/types/idea-graph-types";
import { GENERATABLE_TYPES } from "@/lib/types/idea-graph-types";
import { cn } from "@/lib/utils";

const NODE_TYPES = {
  idea: IdeaGraphNode,
  subIdea: IdeaGraphNode,
  hook: IdeaGraphNode,
  script: IdeaGraphNode,
  description: IdeaGraphNode,
  hashtags: IdeaGraphNode,
  ideaBlock: IdeaGraphNode,
};

const ROOT_NODE_ID = "root-idea";

function graphToFlow(graph: IdeaGraphData | null): { nodes: Node[]; edges: Edge[] } {
  if (!graph?.nodes?.length) {
    return {
      nodes: [
        {
          id: ROOT_NODE_ID,
          type: "idea",
          position: { x: 80, y: 80 },
          data: { content: "", label: undefined, ready: undefined },
        } as Node<IdeaNodeData, IdeaNodeType>,
      ],
      edges: [],
    };
  }
  const nodes: Node[] = graph.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: {
      content: n.data?.content ?? "",
      label: n.data?.label,
      ready: n.data?.ready,
      inputDisabled: n.data?.inputDisabled,
      scriptHook: n.data?.scriptHook,
      scriptBody: n.data?.scriptBody,
      scriptEnd: n.data?.scriptEnd,
      hookLocked: n.data?.hookLocked,
    },
  }));
  const edges: Edge[] = (graph.edges ?? []).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
  }));
  return { nodes, edges };
}

function flowToGraph(nodes: Node[], edges: Edge[]): IdeaGraphData {
  return {
    nodes: nodes.map((n) => {
      const d = n.data as IdeaNodeData;
      const type = (n.type ?? "idea") as IdeaNodeType;
      const hasSections =
        (d?.scriptHook ?? "") !== "" ||
        (d?.scriptBody ?? "") !== "" ||
        (d?.scriptEnd ?? "") !== "";
      return {
        id: n.id,
        type,
        position: n.position,
        data: {
          content: d?.content ?? "",
          label: d?.label,
          ready: d?.ready,
          inputDisabled: d?.inputDisabled,
          scriptHook: d?.scriptHook,
          scriptBody: d?.scriptBody ?? (type === "script" && !hasSections && d?.content ? d.content : undefined),
          scriptEnd: d?.scriptEnd,
          hookLocked: d?.hookLocked,
        },
      };
    }),
    edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
  };
}

function generateNodeId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type IdeaCanvasInnerProps = {
  initialGraph: IdeaGraphData | null;
  ideaId: string;
  onSaveGraph: (ideaId: string, graph: IdeaGraphData) => Promise<void>;
  onBrainstormNote: (params: { nodeId: string; currentContent: string }) => Promise<string>;
  onBrainstormSubIdeas?: (params: { parentContent: string }) => Promise<string[]>;
  onGenerateNodeContent?: (params: {
    type: IdeaNodeType;
    contextContent: string;
    openingHook?: string;
    additionalContext?: string;
  }) => Promise<string>;
  onGenerateThreeIdeas?: () => Promise<string[]>;
  className?: string;
};

function IdeaCanvasInner({
  initialGraph,
  ideaId,
  onSaveGraph,
  onBrainstormNote,
  onBrainstormSubIdeas,
  onGenerateNodeContent,
  onGenerateThreeIdeas,
  className,
}: IdeaCanvasInnerProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => graphToFlow(initialGraph),
    [initialGraph]
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appliedInitialIdRef = useRef<string | null>(null);
  const { getNodes, getEdges } = useReactFlow();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<IdeaNodeType | null>(null);
  const [selectedNodeContent, setSelectedNodeContent] = useState("");
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBrainstormingSubIdeas, setIsBrainstormingSubIdeas] = useState(false);

  // Only sync initial graph → state on mount or when switching project. Avoid overwriting
  // local edits when parent re-renders after our own save (query cache update).
  useEffect(() => {
    if (appliedInitialIdRef.current === ideaId) return;
    appliedInitialIdRef.current = ideaId;
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [ideaId, initialNodes, initialEdges, setNodes, setEdges]);

  useOnSelectionChange({
    onChange: ({ nodes: selectedNodes, edges: selectedEdges }) => {
      const single = selectedNodes[0];
      if (single) {
        setSelectedNodeId(single.id);
        setSelectedNodeType((single.type as IdeaNodeType) ?? "idea");
        setSelectedNodeContent((single.data as IdeaNodeData)?.content ?? "");
      } else {
        setSelectedNodeId(null);
        setSelectedNodeType(null);
        setSelectedNodeContent("");
      }
      setSelectedEdgeIds(selectedEdges.map((e) => e.id));
    },
  });

  const persistGraph = useCallback(() => {
    const currentNodes = getNodes();
    const currentEdges = getEdges();
    const graph = flowToGraph(currentNodes, currentEdges);
    void onSaveGraph(ideaId, graph);
  }, [ideaId, onSaveGraph, getNodes, getEdges]);

  useEffect(() => {
    const handleBrainstorm = async (e: Event) => {
      const { nodeId, currentContent } = (e as CustomEvent<{ nodeId: string; currentContent: string }>).detail;
      const nodes = getNodes();
      const edges = getEdges();
      const node = nodes.find((n) => n.id === nodeId);
      const nodeType = (node?.type ?? "idea") as IdeaNodeType;
      const isEmpty = !(currentContent ?? "").trim();
      const isGeneratable =
        GENERATABLE_TYPES.includes(nodeType) && onGenerateNodeContent;

      if (isGeneratable && isEmpty) {
        const incoming = edges.filter((e) => e.target === nodeId);
        const parentId = incoming.find(
          (e) => nodes.find((n) => n.id === e.source)?.type !== "ideaBlock"
        )?.source ?? incoming[0]?.source;
        const parentNode = parentId ? nodes.find((n) => n.id === parentId) : null;
        const parentContent = (parentNode?.data as IdeaNodeData)?.content ?? "";
        const ideaBlockSources = incoming
          .map((e) => nodes.find((n) => n.id === e.source))
          .filter((n) => n?.type === "ideaBlock");
        const additionalContext = ideaBlockSources
          .map((n) => (n?.data as IdeaNodeData)?.content?.trim())
          .filter(Boolean)
          .join("\n\n");
        const openingHook =
          nodeType === "script" && parentNode?.type === "hook" ? parentContent : undefined;
        try {
          const content = await onGenerateNodeContent({
            type: nodeType,
            contextContent: parentContent || "General content idea.",
            openingHook,
            additionalContext: additionalContext || undefined,
          });
          if (nodeType === "hook" && content.includes("---")) {
            const hooksList = content.split(/\n---\n/).map((s) => s.trim()).filter(Boolean);
            if (hooksList.length > 0 && parentId) {
              const baseX = node?.position?.x ?? 400;
              const baseY = node?.position?.y ?? 80;
              const NODE_GAP = 24;
              const newNodes: Node<IdeaNodeData, IdeaNodeType>[] = hooksList.map((c, i) => ({
                id: generateNodeId(),
                type: "hook",
                position: { x: baseX, y: baseY + i * (100 + NODE_GAP) },
                data: { content: c, inputDisabled: true },
              }));
              const newEdges = newNodes.map((n) => ({
                id: `e-${parentId}-${n.id}`,
                source: parentId,
                target: n.id,
              }));
              setNodes((nds) => [
                ...nds.filter((n) => n.id !== nodeId).map((n) =>
                  n.id === parentId ? { ...n, data: { ...n.data, inputDisabled: true } as IdeaNodeData } : n
                ),
                ...newNodes,
              ]);
              setEdges((eds) => [...eds.filter((e) => e.target !== nodeId), ...newEdges]);
            } else {
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === nodeId ? { ...n, data: { ...n.data, content, inputDisabled: false } as IdeaNodeData } : n
                )
              );
            }
          } else {
            setNodes((nds) =>
              nds.map((n) => {
                if (n.id !== nodeId) {
                  if (n.id === parentId) return { ...n, data: { ...n.data, inputDisabled: true } as IdeaNodeData };
                  return n;
                }
                const d = { ...n.data, content, inputDisabled: false } as IdeaNodeData;
                if (nodeType === "script") {
                  let scriptHook = openingHook ?? "";
                  let scriptBody = "";
                  let scriptEnd = "";
                  try {
                    const parsed = JSON.parse(content) as { hook?: string; body?: string; end?: string };
                    if (parsed && typeof parsed.hook === "string" && typeof parsed.body === "string" && typeof parsed.end === "string") {
                      scriptHook = parsed.hook.trim();
                      scriptBody = parsed.body.trim();
                      scriptEnd = parsed.end.trim();
                    } else {
                      scriptBody = openingHook ? content.replace(openingHook.trim(), "").trim() : content;
                    }
                  } catch {
                    scriptBody = openingHook ? content.replace(openingHook.trim(), "").trim() : content;
                  }
                  d.scriptHook = scriptHook;
                  d.scriptBody = scriptBody;
                  d.scriptEnd = scriptEnd;
                  if (openingHook) d.hookLocked = true;
                }
                return { ...n, data: d };
              })
            );
          }
          persistGraph();
        } catch {
          // toast handled by caller
        }
        return;
      }

      try {
        const result = await onBrainstormNote({ nodeId, currentContent });
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...n.data, content: result } as IdeaNodeData }
              : n
          )
        );
        persistGraph();
      } catch {
        // toast handled by caller
      }
    };
    window.addEventListener("idea-graph-brainstorm", handleBrainstorm);
    return () => window.removeEventListener("idea-graph-brainstorm", handleBrainstorm);
  }, [onBrainstormNote, onGenerateNodeContent, setNodes, setEdges, getNodes, getEdges, persistGraph]);

  const DEBOUNCE_MS = 400;

  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null;
      persistGraph();
    }, DEBOUNCE_MS);
  }, [persistGraph]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      scheduleSave();
    },
    [onNodesChange, scheduleSave]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const filtered = changes.filter((c) => c.type !== "remove");
      if (filtered.length > 0) {
        onEdgesChange(filtered);
        scheduleSave();
      }
    },
    [onEdgesChange, scheduleSave]
  );

  const onContentChange = useCallback(
    (nodeId: string, content: string) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, content } as IdeaNodeData } : n
        )
      );
      scheduleSave();
    },
    [setNodes, scheduleSave]
  );

  const onReadyChange = useCallback(
    (nodeId: string, ready: boolean) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ready } as IdeaNodeData } : n
        )
      );
      scheduleSave();
    },
    [setNodes, scheduleSave]
  );

  const onScriptChange = useCallback(
    (nodeId: string, section: "hook" | "body" | "end", value: string) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId) return n;
          const d = { ...n.data } as IdeaNodeData;
          if (section === "hook") d.scriptHook = value;
          if (section === "body") d.scriptBody = value;
          if (section === "end") d.scriptEnd = value;
          d.content = [d.scriptHook ?? "", d.scriptBody ?? "", d.scriptEnd ?? ""].filter(Boolean).join("\n\n");
          return { ...n, data: d };
        })
      );
      scheduleSave();
    },
    [setNodes, scheduleSave]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
      scheduleSave();
    },
    [setEdges, scheduleSave]
  );

  const getNextPosition = useCallback(() => {
    const currentNodes = getNodes();
    if (currentNodes.length === 0) return { x: 80, y: 80 };
    const rightmost = Math.max(...currentNodes.map((n) => n.position.x + (n.measured?.width ?? 240)));
    const bottom = Math.max(...currentNodes.map((n) => n.position.y));
    return { x: rightmost + 60, y: bottom };
  }, [getNodes]);

  const handleAddIdea = useCallback(() => {
    const id = generateNodeId();
    const pos = getNextPosition();
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "idea",
        position: pos,
        data: { content: "" },
      } as Node<IdeaNodeData, IdeaNodeType>,
    ]);
    scheduleSave();
  }, [setNodes, getNextPosition, scheduleSave]);

  const handleGenerateThreeIdeas = useCallback(async () => {
    if (!onGenerateThreeIdeas) return;
    setIsGenerating(true);
    try {
      const ideasList = await onGenerateThreeIdeas();
      if (ideasList.length === 0) return;
      const pos = getNextPosition();
      const newNodes: Node<IdeaNodeData, IdeaNodeType>[] = ideasList.map((content, i) => ({
        id: generateNodeId(),
        type: "idea",
        position: { x: pos.x + i * 280, y: pos.y },
        data: { content },
      }));
      setNodes((nds) => [...nds, ...newNodes]);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(persistGraph, 800);
    } finally {
      setIsGenerating(false);
    }
  }, [onGenerateThreeIdeas, getNextPosition, setNodes, persistGraph]);

  const handleAddSubIdeas = useCallback(async () => {
    if (!selectedNodeId || !selectedNodeContent.trim() || !onBrainstormSubIdeas) return;
    setIsBrainstormingSubIdeas(true);
    try {
      const list = await onBrainstormSubIdeas({ parentContent: selectedNodeContent });
      if (list.length === 0) return;
      const parentNode = getNodes().find((n) => n.id === selectedNodeId);
      const baseX = parentNode ? parentNode.position.x + 320 : 400;
      const baseY = parentNode ? parentNode.position.y : 80;
      const newNodes: Node<IdeaNodeData, IdeaNodeType>[] = list.map((content, i) => ({
        id: generateNodeId(),
        type: "subIdea",
        position: { x: baseX, y: baseY + i * 100 },
        data: { content },
      }));
      const newEdges = newNodes.map((n) => ({
        id: `e-${selectedNodeId}-${n.id}`,
        source: selectedNodeId,
        target: n.id,
      }));
      setNodes((nds) => [...nds, ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);
      scheduleSave();
    } finally {
      setIsBrainstormingSubIdeas(false);
    }
  }, [selectedNodeId, selectedNodeContent, onBrainstormSubIdeas, getNodes, setNodes, setEdges, scheduleSave]);

  const NEXT_STEP_GAP = 60;
  const handleAddNextStep = useCallback(
    (type: IdeaNodeType) => {
      if (!selectedNodeId) return;
      const sourceId = selectedNodeId;
      const sourceNode = getNodes().find((n) => n.id === sourceId);
      const id = generateNodeId();
      const sourceWidth = sourceNode?.measured?.width ?? 240;
      const pos =
        sourceNode != null
          ? {
              x: sourceNode.position.x + sourceWidth + NEXT_STEP_GAP,
              y: sourceNode.position.y,
            }
          : getNextPosition();
      const isScriptFromHook = type === "script" && sourceNode?.type === "hook";
      const sourceHookContent = (sourceNode?.data as IdeaNodeData)?.content?.trim() ?? "";
      setNodes((nds) => [
        ...nds,
        {
          id,
          type,
          position: pos,
          data: {
            content: "",
            ready: type === "script" ? false : undefined,
            ...(isScriptFromHook && sourceHookContent
              ? { scriptHook: sourceHookContent, hookLocked: true }
              : {}),
          },
        } as Node<IdeaNodeData, IdeaNodeType>,
      ]);
      setEdges((eds) => [...eds, { id: `e-${sourceId}-${id}`, source: sourceId, target: id }]);
      scheduleSave();
    },
    [selectedNodeId, getNodes, getNextPosition, setNodes, setEdges, scheduleSave]
  );

  const handleAddIdeaBlock = useCallback(() => {
    if (!selectedNodeId) return;
    const targetId = selectedNodeId;
    const id = generateNodeId();
    const pos = getNextPosition();
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "ideaBlock",
        position: pos,
        data: { content: "" },
      } as Node<IdeaNodeData, IdeaNodeType>,
    ]);
    setEdges((eds) => [...eds, { id: `e-${id}-${targetId}`, source: id, target: targetId }]);
    scheduleSave();
  }, [selectedNodeId, getNextPosition, setNodes, setEdges, scheduleSave]);

  const handleDeleteSelected = useCallback(() => {
    const nodeIdsToRemove = new Set(
      getNodes().filter((n) => n.selected).map((n) => n.id)
    );
    if (nodeIdsToRemove.size === 0) return;
    setNodes((nds) => nds.filter((n) => !nodeIdsToRemove.has(n.id)));
    setEdges((eds) =>
      eds.filter(
        (e) => !nodeIdsToRemove.has(e.source) && !nodeIdsToRemove.has(e.target)
      )
    );
    setSelectedNodeId(null);
    setSelectedNodeType(null);
    setSelectedNodeContent("");
    setSelectedEdgeIds([]);
    scheduleSave();
  }, [getNodes, setNodes, setEdges, scheduleSave]);

  const hasSelection = selectedNodeId !== null || selectedEdgeIds.length > 0;
  const hasReadyScript = useMemo(
    () => nodes.some((n) => n.type === "script" && (n.data as IdeaNodeData)?.ready === true),
    [nodes]
  );

  const nodesWithCallbacks = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        data: { ...n.data, onContentChange, onScriptChange, onReadyChange } as IdeaNodeData,
      })),
    [nodes, onContentChange, onScriptChange, onReadyChange]
  );

  return (
    <div className={cn("h-full w-full", className)}>
        <ReactFlow
        nodes={nodesWithCallbacks}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{ type: "smoothstep" }}
        connectionLineStyle={{ stroke: "hsl(var(--primary))" }}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={["Backspace", "Delete"]}
      >
        <Background />
        <Controls />
        <CanvasToolbar
          selectedNodeId={selectedNodeId}
          selectedNodeType={selectedNodeType}
          selectedNodeContent={selectedNodeContent}
          hasSelection={hasSelection}
          hasReadyScript={hasReadyScript}
          onAddIdea={handleAddIdea}
          onGenerateThreeIdeas={handleGenerateThreeIdeas}
          onAddSubIdeas={handleAddSubIdeas}
          onAddNextStep={handleAddNextStep}
          onAddIdeaBlock={handleAddIdeaBlock}
          onDeleteSelected={handleDeleteSelected}
          isGenerating={isGenerating}
          isBrainstormingSubIdeas={isBrainstormingSubIdeas}
        />
      </ReactFlow>
    </div>
  );
}

export type IdeaCanvasProps = Omit<IdeaCanvasInnerProps, "onSaveGraph" | "onBrainstormNote" | "onBrainstormSubIdeas" | "onGenerateNodeContent" | "onGenerateThreeIdeas"> & {
  onSaveGraph: (ideaId: string, graph: IdeaGraphData) => Promise<void>;
  onBrainstormNote: (params: { nodeId: string; currentContent: string }) => Promise<string>;
  onBrainstormSubIdeas?: (params: { parentContent: string }) => Promise<string[]>;
  onGenerateNodeContent?: (params: { type: IdeaNodeType; contextContent: string }) => Promise<string>;
  onGenerateThreeIdeas?: () => Promise<string[]>;
};

export function IdeaCanvas(props: IdeaCanvasProps) {
  return (
    <ReactFlowProvider>
      <IdeaCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
