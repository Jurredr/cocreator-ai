"use client";

import { useState } from "react";
import {
  addInspirationVideo,
  updateInspirationVideo,
  deleteInspirationVideo,
} from "@/app/dashboard/channel/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, ExternalLink } from "lucide-react";

export type InspirationVideoItem = {
  id: string;
  url: string;
  note: string | null;
};

function isValidUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

function displayUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname + (u.pathname !== "/" ? u.pathname : "");
  } catch {
    return url;
  }
}

export function InspirationVideosList({
  videos: initialVideos,
  channelId: _channelId,
  onSuccess,
}: {
  videos: InspirationVideoItem[];
  channelId: string;
  onSuccess?: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAdd(formData: FormData) {
    const url = (formData.get("url") as string)?.trim();
    if (!url) {
      toast.error("Video URL is required");
      return;
    }
    if (!isValidUrl(url)) {
      toast.error("Please enter a valid URL");
      return;
    }
    const result = await addInspirationVideo(formData);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Inspiration video added");
    setAdding(false);
    onSuccess?.();
  }

  async function handleUpdate(id: string, formData: FormData) {
    const url = (formData.get("url") as string)?.trim();
    if (!url) {
      toast.error("Video URL is required");
      return;
    }
    if (!isValidUrl(url)) {
      toast.error("Please enter a valid URL");
      return;
    }
    const result = await updateInspirationVideo(id, formData);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Updated");
    setEditingId(null);
    onSuccess?.();
  }

  async function handleDelete(id: string) {
    setLoading(id);
    const result = await deleteInspirationVideo(id);
    setLoading(null);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Removed");
    onSuccess?.();
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {initialVideos.map((v) => (
          <li
            key={v.id}
            className="rounded-md border bg-muted/30 px-3 py-2"
          >
            {editingId === v.id ? (
              <form
                action={(formData) => handleUpdate(v.id, formData)}
                className="flex flex-col gap-2"
              >
                <Label htmlFor={`edit-url-${v.id}`} className="text-xs">
                  Video URL
                </Label>
                <Input
                  id={`edit-url-${v.id}`}
                  name="url"
                  type="url"
                  defaultValue={v.url}
                  placeholder="https://youtube.com/watch?v=…"
                  className="text-sm"
                />
                <Label htmlFor={`edit-note-${v.id}`} className="text-xs">
                  What you like about it (optional)
                </Label>
                <Input
                  id={`edit-note-${v.id}`}
                  name="note"
                  defaultValue={v.note ?? ""}
                  placeholder="e.g. Pacing, lighting, tone"
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm">
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1 break-all text-sm font-medium"
                  >
                    {displayUrl(v.url)}
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                  {v.note && (
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      {v.note}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingId(v.id)}
                    aria-label="Edit"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={loading === v.id}
                    onClick={() => handleDelete(v.id)}
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {adding ? (
        <form
          action={handleAdd}
          className="flex flex-col gap-2 rounded-md border border-dashed p-4"
        >
          <Label htmlFor="inspiration-url">Video URL</Label>
          <Input
            id="inspiration-url"
            name="url"
            type="url"
            placeholder="https://youtube.com/watch?v=… or https://tiktok.com/…"
            required
          />
          <Label htmlFor="inspiration-note">
            What do you like about it? (optional)
          </Label>
          <Input
            id="inspiration-note"
            name="note"
            placeholder="e.g. Pacing, lighting, overall vibe"
          />
          <div className="flex gap-2">
            <Button type="submit">Add video</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAdding(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)}>
          <Plus className="size-4" />
          Add inspiration video
        </Button>
      )}
    </div>
  );
}
