"use client";

import { useState } from "react";
import { deletePublishedContent } from "@/app/dashboard/performance/actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ExternalLink, Trash2 } from "lucide-react";
import type { publishedContent } from "@/lib/db/schema";

type PublishedItem = typeof publishedContent.$inferSelect;

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
};

export function PublishedContentList({ items }: { items: PublishedItem[] }) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const result = await deletePublishedContent(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Removed");
      window.location.reload();
    } finally {
      setDeleting(null);
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No published content linked yet. Add one above.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-4 rounded-md border bg-muted/30 px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {PLATFORM_LABELS[item.platform] ?? item.platform}
              </span>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                title={item.url}
              >
                <ExternalLink className="size-4" />
              </a>
            </div>
            <p className="text-muted-foreground truncate text-xs" title={item.url}>
              {item.url}
            </p>
            <div className="mt-1 flex flex-wrap gap-2 text-xs">
              {item.views != null && (
                <span className="text-muted-foreground">Views: {item.views}</span>
              )}
              {item.likes != null && (
                <span className="text-muted-foreground">Likes: {item.likes}</span>
              )}
              {item.comments != null && (
                <span className="text-muted-foreground">
                  Comments: {item.comments}
                </span>
              )}
              {item.shares != null && (
                <span className="text-muted-foreground">
                  Shares: {item.shares}
                </span>
              )}
            </div>
          </div>
          <form action={() => handleDelete(item.id)}>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              disabled={deleting === item.id}
              aria-label="Remove"
            >
              <Trash2 className="size-4" />
            </Button>
          </form>
        </li>
      ))}
    </ul>
  );
}
