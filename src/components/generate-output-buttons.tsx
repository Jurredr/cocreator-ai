"use client";

import { useState } from "react";
import { generateOutput } from "@/app/dashboard/ideas/actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { ContentOutputType } from "@/lib/db/schema";

export function GenerateOutputButtons({
  ideaId,
  type,
}: {
  ideaId: string;
  type: ContentOutputType;
}) {
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const result = await generateOutput(ideaId, type);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Generated");
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGenerate}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        "Generate"
      )}
    </Button>
  );
}
