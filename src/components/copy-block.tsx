"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";

export function CopyBlock({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }

  return (
    <div className="relative">
      <pre className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm">
        {content}
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2"
        onClick={handleCopy}
        aria-label="Copy"
      >
        {copied ? (
          <Check className="size-4 text-green-600" />
        ) : (
          <Copy className="size-4" />
        )}
      </Button>
    </div>
  );
}
