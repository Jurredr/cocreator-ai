"use client";

import { useState } from "react";
import { addPublishedContent } from "@/app/dashboard/performance/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function AddPublishedContentForm({
  onSuccess,
}: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState<string>("");

  async function handleSubmit(formData: FormData) {
    if (!platform) {
      toast.error("Please select a platform");
      return;
    }
    formData.set("platform", platform);
    setLoading(true);
    try {
      const result = await addPublishedContent(formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Published content added");
      const form = document.getElementById("add-published-form") as HTMLFormElement;
      form?.reset();
      setPlatform("");
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      id="add-published-form"
      action={handleSubmit}
      className="flex flex-col gap-4"
    >
      <div className="grid gap-2">
        <Label htmlFor="platform">Platform</Label>
        <Select
          name="platform"
          value={platform}
          onValueChange={setPlatform}
          required
        >
          <SelectTrigger id="platform">
            <SelectValue placeholder="Select platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tiktok">TikTok</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          name="url"
          type="url"
          placeholder="https://..."
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ideaId">Idea ID (optional)</Label>
        <Input
          id="ideaId"
          name="ideaId"
          placeholder="Paste idea UUID to link"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="grid gap-2">
          <Label htmlFor="views">Views</Label>
          <Input id="views" name="views" type="number" min={0} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="likes">Likes</Label>
          <Input id="likes" name="likes" type="number" min={0} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="comments">Comments</Label>
          <Input id="comments" name="comments" type="number" min={0} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="shares">Shares</Label>
          <Input id="shares" name="shares" type="number" min={0} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="publishedAt">Published at (optional)</Label>
        <Input id="publishedAt" name="publishedAt" type="datetime-local" />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Adding…" : "Add published content"}
      </Button>
    </form>
  );
}
