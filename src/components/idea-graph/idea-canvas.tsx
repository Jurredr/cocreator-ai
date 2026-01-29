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
import type { IdeaGraphData, IdeaNodeType, IdeaNodeData } from "@/lib/idea-graph-types";
import { cn } from "@/lib/utils";

const NODE_TYPES = {
  idea: IdeaGraphNode,
  subIdea: IdeaGraphNode,
  hook: IdeaGraphNode,
  script: IdeaGraphNode,
  description: IdeaGraphNode,
  hashtags: IdeaGraphNode,
};

function graphToFlow(graph: IdeaGraphData | null): { nodes: Node[]; edges: Edge[] } {
  if (!graph?.nodes?.length) {
    return { nodes: [], edges: [] };
  }
  const nodes: Node[] = graph.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: { content: n.data?.content ?? "", label: n.data?.label },
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
    nodes: nodes.map((n) => ({
      id: n.id,
      type: (n.type ?? "idea") as IdeaNodeType,
      position: n.position,
      data: {
        content: (n.data as IdeaNodeData)?.content ?? "",
        label: (n.data as IdeaNodeData)?.label,
      },
    })),
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
  onGenerateNodeContent?: (params: { type: IdeaNodeType; contextContent: string }) => Promise<string>;
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
  const { getNodes, getEdges } = useReactFlow();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<IdeaNodeType | null>(null);
  const [selectedNodeContent, setSelectedNodeContent] = useState("");
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBrainstormingSubIdeas, setIsBrainstormingSubIdeas] = useState(false);

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
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  useEffect(() => {
    const handleBrainstorm = async (e: Event) => {
      const { nodeId, currentContent } = (e as CustomEvent<{ nodeId: string; currentContent: string }>).detail;
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
  }, [onBrainstormNote, setNodes, persistGraph]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(persistGraph, 800);
    },
    [onNodesChange, persistGraph]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(persistGraph, 800);
    },
    [onEdgesChange, persistGraph]
  );

  const onContentChange = useCallback(
    (nodeId: string, content: string) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, content } as IdeaNodeData } : n
        )
      );
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(persistGraph, 800);
    },
    [setNodes, persistGraph]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(persistGraph, 800);
    },
    [setEdges, persistGraph]
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
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(persistGraph, 800);
  }, [setNodes, getNextPosition, persistGraph]);

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
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(persistGraph, 800);
    } finally {
      setIsBrainstormingSubIdeas(false);
    }
  }, [selectedNodeId, selectedNodeContent, onBrainstormSubIdeas, getNodes, setNodes, setEdges, persistGraph]);

  const handleAddNextStep = useCallback(
    async (type: IdeaNodeType) => {
      if (!selectedNodeId) return;
      const id = generateNodeId();
      const pos = getNextPosition();
      const contextContent = selectedNodeContent.trim() || "General content idea.";
      let content = "";
      if (onGenerateNodeContent) {
        try {
          content = await onGenerateNodeContent({ type, contextContent });
        } catch {
          // keep empty
        }
      }
      setNodes((nds) => [
        ...nds,
        {
          id,
          type,
          position: pos,
          data: { content },
        } as Node<IdeaNodeData, IdeaNodeType>,
      ]);
      setEdges((eds) => [...eds, { id: `e-${selectedNodeId}-${id}`, source: selectedNodeId, target: id }]);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(persistGraph, 800);
    },
    [selectedNodeId, selectedNodeContent, onGenerateNodeContent, getNextPosition, setNodes, setEdges, persistGraph]
  );

  const handleDeleteSelected = useCallback(() => {
    const nodeIdsToRemove = new Set(
      getNodes().filter((n) => n.selected).map((n) => n.id)
    );
    const edgeIdsToRemove = new Set(
      getEdges().filter((e) => e.selected).map((e) => e.id)
    );
    if (nodeIdsToRemove.size === 0 && edgeIdsToRemove.size === 0) return;
    setNodes((nds) =>
      nds.filter((n) => !nodeIdsToRemove.has(n.id))
    );
    setEdges((eds) =>
      eds.filter(
        (e) =>
          !edgeIdsToRemove.has(e.id) &&
          !nodeIdsToRemove.has(e.source) &&
          !nodeIdsToRemove.has(e.target)
      )
    );
    setSelectedNodeId(null);
    setSelectedNodeType(null);
    setSelectedNodeContent("");
    setSelectedEdgeIds([]);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(persistGraph, 800);
  }, [getNodes, getEdges, setNodes, setEdges, persistGraph]);

  const hasSelection = selectedNodeId !== null || selectedEdgeIds.length > 0;

  const nodesWithCallbacks = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        data: { ...n.data, onContentChange } as IdeaNodeData,
      })),
    [nodes, onContentChange]
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
          onAddIdea={handleAddIdea}
          onGenerateThreeIdeas={handleGenerateThreeIdeas}
          onAddSubIdeas={handleAddSubIdeas}
          onAddNextStep={handleAddNextStep}
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
