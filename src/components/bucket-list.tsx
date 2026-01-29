"use client";

import { useState } from "react";
import { addBucket, deleteBucket } from "@/app/dashboard/channel/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
export type BucketListItem = {
  id: string;
  name: string;
  description: string | null;
};

export function BucketList({
  buckets: initialBuckets,
  channelId: _channelId,
  onSuccess,
}: {
  buckets: BucketListItem[];
  channelId: string;
  onSuccess?: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAddBucket(formData: FormData) {
    const result = await addBucket(formData);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Bucket added");
    setAdding(false);
    onSuccess?.();
  }

  async function handleDelete(bucketId: string) {
    setLoading(bucketId);
    const result = await deleteBucket(bucketId);
    setLoading(null);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Bucket removed");
    onSuccess?.();
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {initialBuckets.map((b) => (
          <li
            key={b.id}
            className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2"
          >
            <div>
              <p className="font-medium">{b.name}</p>
              {b.description && (
                <p className="text-muted-foreground text-sm">{b.description}</p>
              )}
            </div>
            <form action={() => handleDelete(b.id)}>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                disabled={loading === b.id}
                aria-label="Delete bucket"
              >
                <Trash2 className="size-4" />
              </Button>
            </form>
          </li>
        ))}
      </ul>
      {adding ? (
        <form
          action={handleAddBucket}
          className="flex flex-col gap-2 rounded-md border border-dashed p-4"
        >
          <Label htmlFor="bucket-name">Bucket name</Label>
          <Input id="bucket-name" name="name" placeholder="e.g. Tips" required />
          <Label htmlFor="bucket-desc">Description (optional)</Label>
          <Input
            id="bucket-desc"
            name="description"
            placeholder="Short description"
          />
          <div className="flex gap-2">
            <Button type="submit">Add bucket</Button>
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
          Add bucket
        </Button>
      )}
    </div>
  );
}
