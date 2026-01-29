"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { saveIdea } from "@/app/dashboard/ideas/actions";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function SaveIdeaForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const result = await saveIdea(formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Idea saved");
      void queryClient.invalidateQueries({ queryKey: queryKeys.me.ideas() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.me.dashboard() });
      router.push(`/dashboard/ideas/${result.ideaId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="content">Idea</Label>
        <textarea
          id="content"
          name="content"
          placeholder="Describe your content idea..."
          rows={4}
          required
          className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Save idea"}
      </Button>
    </form>
  );
}
