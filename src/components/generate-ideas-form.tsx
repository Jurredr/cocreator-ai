"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { generateAndSaveIdeas } from "@/app/dashboard/ideas/actions";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";

type Bucket = { id: string; name: string };

export function GenerateIdeasForm({
  buckets = [],
}: {
  buckets?: Bucket[];
}) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [ideaIds, setIdeaIds] = useState<string[]>([]);
  const ANY_BUCKET = "__any";
  const [bucketId, setBucketId] = useState<string>(ANY_BUCKET);
  const [roughIdea, setRoughIdea] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setIdeaIds([]);
    try {
      const formData = new FormData();
      if (bucketId && bucketId !== ANY_BUCKET) formData.set("bucketId", bucketId);
      if (roughIdea.trim()) formData.set("roughIdea", roughIdea.trim());
      const result = await generateAndSaveIdeas(formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Ideas generated");
      setIdeaIds(result.ideaIds);
      void queryClient.invalidateQueries({ queryKey: queryKeys.me.projects() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.me.dashboard() });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {buckets.length > 0 && (
        <div className="grid gap-2">
          <Label htmlFor="gen-bucket">Generate within bucket (optional)</Label>
          <Select value={bucketId} onValueChange={setBucketId}>
            <SelectTrigger id="gen-bucket">
              <SelectValue placeholder="Any bucket" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY_BUCKET}>Any bucket</SelectItem>
              {buckets.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="rough-idea">
          Rough idea (optional) — AI will turn it into concrete ideas
        </Label>
        <textarea
          id="rough-idea"
          placeholder="e.g. Something about morning routines and productivity..."
          value={roughIdea}
          onChange={(e) => setRoughIdea(e.target.value)}
          rows={3}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <Button onClick={handleGenerate} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Generating…
          </>
        ) : roughIdea.trim() ? (
          "Refine idea & generate"
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
                href={`/dashboard/projects/${id}`}
                className="text-primary underline"
              >
                View project {i + 1}
              </Link>
              {i < ideaIds.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
