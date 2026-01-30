"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { extractThumbnailFromVideo } from "@/lib/broll-thumbnail";
import { Loader2, Plus } from "lucide-react";
import type { MediaOrientation } from "@/lib/db/schema";

/** Read image as data URL (resized for storage). */
async function imageToDataUrl(file: File, maxSize = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not available"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export function BrollUpload({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [orientation, setOrientation] = useState<MediaOrientation | "">("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVideo = selectedFile?.type.startsWith("video/") ?? false;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setOrientation("");
      return;
    }
    if (!file.type.startsWith("video/") && !file.type.startsWith("image/")) {
      toast.error("Please select a video or image file");
      setSelectedFile(null);
      setOrientation("");
      return;
    }
    setSelectedFile(file);
    setDescription("");
    setOrientation(file.type.startsWith("video/") ? "" : "");
  }

  async function handleAddToLibrary() {
    if (!selectedFile) {
      toast.error("Please select a video or image file first");
      return;
    }
    setLoading(true);
    try {
      let thumbnailDataUrl: string;
      const mediaType = selectedFile.type.startsWith("video/") ? "video" : "image";
      const recordingDate =
        mediaType === "video"
          ? new Date(selectedFile.lastModified).toISOString()
          : undefined;

      if (mediaType === "video") {
        thumbnailDataUrl = await extractThumbnailFromVideo(selectedFile, 1);
      } else {
        thumbnailDataUrl = await imageToDataUrl(selectedFile);
      }

      const res = await fetch("/api/broll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: selectedFile.name,
          thumbnailDataUrl,
          description: description.trim() || undefined,
          recordingDate,
          mediaType,
          orientation:
            mediaType === "video" && orientation
              ? orientation
              : undefined,
          source: "uploaded",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to save");
        return;
      }
      toast.success("Added to media library");
      setDescription("");
      setSelectedFile(null);
      setOrientation("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onSuccess?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to process file"
      );
    } finally {
      setLoading(false);
    }
  }

  function clearSelection() {
    setSelectedFile(null);
    setDescription("");
    setOrientation("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="broll-file">Video or image file</Label>
        <input
          ref={fileInputRef}
          id="broll-file"
          type="file"
          accept="video/*,image/*"
          onChange={handleFileChange}
          disabled={loading}
          className="file:bg-primary file:text-primary-foreground file:mr-2 file:rounded-md file:border-0 file:px-3 file:py-1 file:text-sm"
        />
      </div>
      {selectedFile && (
        <>
          {isVideo && (
            <div className="grid gap-2">
              <Label htmlFor="orientation">Orientation</Label>
              <Select
                value={orientation}
                onValueChange={(v) => setOrientation(v as MediaOrientation | "")}
                disabled={loading}
              >
                <SelectTrigger id="orientation">
                  <SelectValue placeholder="Select aspect ratio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertical">Vertical (9:16)</SelectItem>
                  <SelectItem value="horizontal">Horizontal (16:9)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Choose vertical for Reels/TikTok, horizontal for YouTube.
              </p>
            </div>
          )}
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
