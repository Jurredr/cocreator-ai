"use client";

import { useState } from "react";
import { runBrainstorm } from "@/app/dashboard/channel/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export function BrainstormBlock({
  channelName: _channelName,
  coreAudience: _coreAudience,
  goals: _goals,
  buckets: _buckets,
}: {
  channelName: string;
  coreAudience: string | null;
  goals: string | null;
  buckets: { name: string; description: string }[];
}) {
  const [loading, setLoading] = useState(false);
  const [suggestedGoals, setSuggestedGoals] = useState<string | null>(null);
  const [suggestedBuckets, setSuggestedBuckets] = useState<
    { name: string; description: string }[] | null
  >(null);

  async function handleBrainstorm(mode: "goals" | "buckets" | "both") {
    setLoading(true);
    setSuggestedGoals(null);
    setSuggestedBuckets(null);
    try {
      const result = await runBrainstorm(mode);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.goals) setSuggestedGoals(result.goals);
      if (result.buckets?.length) setSuggestedBuckets(result.buckets);
      toast.success("Brainstorm complete");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          AI brainstorm
        </CardTitle>
        <CardDescription>
          Get AI suggestions for goals and content buckets based on your
          channel.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBrainstorm("goals")}
            disabled={loading}
          >
            Suggest goals
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBrainstorm("buckets")}
            disabled={loading}
          >
            Suggest buckets
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBrainstorm("both")}
            disabled={loading}
          >
            Suggest both
          </Button>
        </div>
        {loading && (
          <p className="text-muted-foreground text-sm">Thinking…</p>
        )}
        {suggestedGoals && (
          <div className="rounded-md border bg-muted/30 p-3">
            <Label className="text-xs">Suggested goals</Label>
            <p className="mt-1 text-sm whitespace-pre-wrap">{suggestedGoals}</p>
            <p className="text-muted-foreground mt-2 text-xs">
              Copy and paste into the Channel form above if you like them.
            </p>
          </div>
        )}
        {suggestedBuckets && suggestedBuckets.length > 0 && (
          <div className="rounded-md border bg-muted/30 p-3">
            <Label className="text-xs">Suggested buckets</Label>
            <ul className="mt-1 list-inside list-disc text-sm">
              {suggestedBuckets.map((b, i) => (
                <li key={i}>
                  <strong>{b.name}</strong>
                  {b.description ? ` — ${b.description}` : ""}
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground mt-2 text-xs">
              Add these manually in the Content buckets section above.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
