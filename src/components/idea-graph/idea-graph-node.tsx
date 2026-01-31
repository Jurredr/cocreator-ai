"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { NODE_LABELS, type IdeaNodeType, type IdeaNodeData } from "@/lib/types/idea-graph-types";
import { cn } from "@/lib/utils";

const TEXTAREA_MAX_H = 400;
const TEXTAREA_BASE =
  "nodrag nopan w-full min-h-[52px] resize-y overflow-y-auto rounded-md border border-input bg-transparent px-2 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const TEXTAREA_DISABLED =
  "disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-muted/40 disabled:text-muted-foreground";
const TEXTAREA_CLASS = `${TEXTAREA_BASE} ${TEXTAREA_DISABLED}`;

function resizeToContent(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_H)}px`;
}

export type IdeaGraphNodeData = IdeaNodeData;

export type IdeaGraphNode = Node<IdeaGraphNodeData, IdeaNodeType>;

export type IdeaGraphNodeProps = NodeProps<IdeaGraphNode>;

export function IdeaGraphNode(props: IdeaGraphNodeProps) {
  const { id, data, type: nodeType, selected } = props;
  const [content, setContent] = useState(data.content ?? "");
  const [scriptHook, setScriptHook] = useState(data.scriptHook ?? "");
  const [scriptBody, setScriptBody] = useState(data.scriptBody ?? "");
  const [scriptEnd, setScriptEnd] = useState(data.scriptEnd ?? "");
  const [ready, setReady] = useState(Boolean(data.ready));
  const [isBrainstorming, setIsBrainstorming] = useState(false);

  const inputDisabled = Boolean(data.inputDisabled);
  const hookLocked = Boolean(data.hookLocked);
  const loading = Boolean(data.loading);

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const scriptHookRef = useRef<HTMLTextAreaElement>(null);
  const scriptBodyRef = useRef<HTMLTextAreaElement>(null);
  const scriptEndRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(data.content ?? "");
    const hasSections =
      (data.scriptHook ?? "") !== "" ||
      (data.scriptBody ?? "") !== "" ||
      (data.scriptEnd ?? "") !== "";
    setScriptHook(data.scriptHook ?? "");
    setScriptBody(data.scriptBody ?? (hasSections ? "" : (data.content ?? "")));
    setScriptEnd(data.scriptEnd ?? "");
    setReady(Boolean(data.ready));
    setIsBrainstorming(false);
  }, [data.content, data.scriptHook, data.scriptBody, data.scriptEnd, data.ready]);

  useEffect(() => {
    resizeToContent(contentRef.current);
  }, [content]);
  useEffect(() => {
    resizeToContent(scriptHookRef.current);
  }, [scriptHook]);
  useEffect(() => {
    resizeToContent(scriptBodyRef.current);
  }, [scriptBody]);
  useEffect(() => {
    resizeToContent(scriptEndRef.current);
  }, [scriptEnd]);

  const label = NODE_LABELS[nodeType] ?? nodeType;
  const canBrainstorm = ["idea", "subIdea", "hook", "script", "description", "hashtags", "ideaBlock"].includes(nodeType);
  const isScript = nodeType === "script";

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setContent(value);
      data.onContentChange?.(id, value);
    },
    [id, data]
  );

  const handleScriptChange = useCallback(
    (section: "hook" | "body" | "end") => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (section === "hook") setScriptHook(value);
      if (section === "body") setScriptBody(value);
      if (section === "end") setScriptEnd(value);
      data.onScriptChange?.(id, section, value);
    },
    [id, data]
  );

  const handleReadyChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.checked;
      setReady(value);
      data.onReadyChange?.(id, value);
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
          "nowheel min-w-[220px] max-w-[320px] shadow-md transition-shadow",
          selected && "ring-2 ring-primary",
          isScript && ready && "ring-2 ring-primary/50"
        )}
      >
        <CardHeader className="py-2 px-3 flex flex-row items-center justify-between space-y-0 gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
          {canBrainstorm && !inputDisabled && (
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
          {loading && (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-hidden />
          )}
        </CardHeader>
        <CardContent className="py-0 px-3 pb-3 pt-0 space-y-2">
          {isScript && (
            <>
              <label className="nodrag nopan flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ready}
                  onChange={handleReadyChange}
                  disabled={inputDisabled}
                  className="size-4 rounded border-input"
                />
                <Label className="text-xs font-medium cursor-pointer flex items-center gap-1.5">
                  <CheckCircle2 className={cn("size-3.5", ready && "text-primary")} />
                  Mark as ready (required for title, description, hashtags)
                </Label>
              </label>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Hook</Label>
                <textarea
                  ref={scriptHookRef}
                  value={scriptHook}
                  onChange={handleScriptChange("hook")}
                  placeholder="Opening line..."
                  disabled={inputDisabled || hookLocked}
                  className={TEXTAREA_CLASS}
                  rows={1}
                  title={hookLocked ? "Hook is from the connected hook node" : undefined}
                />
                <Label className="text-xs text-muted-foreground">Body</Label>
                <textarea
                  ref={scriptBodyRef}
                  value={scriptBody}
                  onChange={handleScriptChange("body")}
                  placeholder="Main content..."
                  disabled={inputDisabled}
                  className={TEXTAREA_CLASS}
                  rows={1}
                />
                <Label className="text-xs text-muted-foreground">End</Label>
                <textarea
                  ref={scriptEndRef}
                  value={scriptEnd}
                  onChange={handleScriptChange("end")}
                  placeholder="Closing / CTA..."
                  disabled={inputDisabled}
                  className={TEXTAREA_CLASS}
                  rows={1}
                />
              </div>
            </>
          )}
          {!isScript && (
            <textarea
              ref={contentRef}
              value={content}
              onChange={handleContentChange}
              placeholder={loading ? "Generating..." : `Add ${label.toLowerCase()}...`}
              disabled={inputDisabled}
              className={TEXTAREA_CLASS}
              rows={1}
            />
          )}
        </CardContent>
      </Card>
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !border-2 !bg-background" />
    </>
  );
}
