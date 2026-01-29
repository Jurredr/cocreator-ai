"use client";

import { useState } from "react";
import { generateAndSaveIdeas } from "@/app/dashboard/ideas/actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export function GenerateIdeasForm() {
  const [loading, setLoading] = useState(false);
  const [ideaIds, setIdeaIds] = useState<string[]>([]);

  async function handleGenerate() {
    setLoading(true);
    setIdeaIds([]);
    try {
      const result = await generateAndSaveIdeas(new FormData());
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Ideas generated");
      setIdeaIds(result.ideaIds);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={handleGenerate} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Generating…
          </>
        ) : (
          "Generate 3 ideas"
        )}
      </Button>
      {ideaIds.length > 0 && (
        <p className="text-muted-foreground text-sm">
          Saved.{" "}
          {ideaIds.map((id, i) => (
            <span key={id}>
              <Link
                href={`/dashboard/ideas/${id}`}
                className="text-primary underline"
              >
                View idea {i + 1}
              </Link>
              {i < ideaIds.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
