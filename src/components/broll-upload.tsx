"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { extractThumbnailFromVideo } from "@/lib/broll-thumbnail";
import { Loader2 } from "lucide-react";

export function BrollUpload() {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }
    setLoading(true);
    try {
      const thumbnailDataUrl = await extractThumbnailFromVideo(file, 0);
      const res = await fetch("/api/broll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          thumbnailDataUrl,
          description: description.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to save");
        return;
      }
      toast.success("B-roll added");
      setDescription("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      window.location.reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to extract thumbnail"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="broll-file">Video file</Label>
        <input
          ref={fileInputRef}
          id="broll-file"
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          disabled={loading}
          className="file:bg-primary file:text-primary-foreground file:mr-2 file:rounded-md file:border-0 file:px-3 file:py-1 file:text-sm"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="broll-desc">Description (optional)</Label>
        <Input
          id="broll-desc"
          placeholder="e.g. Sunset timelapse, office workspace"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />
      </div>
      {loading && (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Extracting thumbnail…
        </p>
      )}
    </div>
  );
}
