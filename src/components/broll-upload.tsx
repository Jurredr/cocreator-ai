"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { extractThumbnailFromVideo } from "@/lib/broll-thumbnail";
import { Loader2, Plus } from "lucide-react";

export function BrollUpload({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("video/")) {
      if (file) toast.error("Please select a video file");
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setDescription("");
  }

  async function handleAddToLibrary() {
    if (!selectedFile) {
      toast.error("Please select a video file first");
      return;
    }
    setLoading(true);
    try {
      const thumbnailDataUrl = await extractThumbnailFromVideo(selectedFile, 1);
      const recordingDate = new Date(selectedFile.lastModified).toISOString();
      const res = await fetch("/api/broll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: selectedFile.name,
          thumbnailDataUrl,
          description: description.trim() || undefined,
          recordingDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to save");
        return;
      }
      toast.success("B-roll added to library");
      setDescription("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onSuccess?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to extract thumbnail"
      );
    } finally {
      setLoading(false);
    }
  }

  function clearSelection() {
    setSelectedFile(null);
    setDescription("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
      {selectedFile && (
        <>
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
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={handleAddToLibrary}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Adding…
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  Add to library
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={clearSelection}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
