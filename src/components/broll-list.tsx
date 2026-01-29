"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

export type BrollListItem = {
  id: string;
  filename: string;
  thumbnailDataUrl: string;
  description: string | null;
  recordingDate: string | null;
  createdAt: string;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BrollList({
  items,
  onDelete,
  onEdit,
}: {
  items: BrollListItem[];
  onDelete?: (id: string) => void;
  onEdit?: (id: string, updates: { filename?: string; description?: string }) => void;
}) {
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<BrollListItem | null>(null);
  const [editFilename, setEditFilename] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter(
      (item) =>
        item.filename.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false)
    );
  }, [items, search]);

  function openEdit(item: BrollListItem) {
    setEditItem(item);
    setEditFilename(item.filename);
    setEditDescription(item.description ?? "");
  }

  async function handleSaveEdit() {
    if (!editItem || !onEdit) return;
    setSaving(true);
    try {
      onEdit(editItem.id, {
        filename: editFilename.trim() || editItem.filename,
        description: editDescription.trim() || undefined,
      });
      toast.success("B-roll updated");
      setEditItem(null);
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: BrollListItem) {
    if (!onDelete) return;
    if (!confirm(`Delete "${item.filename}"? This cannot be undone.`)) return;
    setDeletingId(item.id);
    try {
      onDelete(item.id);
      toast.success("B-roll removed");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No B-roll yet. Add a video file above to get started.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          placeholder="Search by filename or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((item) => (
          <li
            key={item.id}
            className="flex flex-col overflow-hidden rounded-lg border bg-muted/30"
          >
            <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.thumbnailDataUrl}
                alt={item.filename}
                className="h-full w-full object-cover"
              />
              <div className="absolute right-2 top-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="size-8 rounded-full bg-background/80 shadow-sm hover:bg-background"
                      aria-label="Options"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => openEdit(item)}
                      disabled={!onEdit}
                    >
                      <Pencil className="mr-2 size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(item)}
                      disabled={!onDelete || deletingId === item.id}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-1 p-3">
              <p className="truncate text-sm font-medium" title={item.filename}>
                {item.filename}
              </p>
              {item.description && (
                <p className="text-muted-foreground line-clamp-2 text-xs">
                  {item.description}
                </p>
              )}
              <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-0 text-xs">
                <span title="Recording date">
                  Recorded: {formatDate(item.recordingDate)}
                </span>
                <span title="Upload date">
                  Added: {formatDate(item.createdAt)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && search.trim() && (
        <p className="text-muted-foreground py-4 text-center text-sm">
          No clips match &quot;{search}&quot;.
        </p>
      )}

      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit B-roll</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-filename">Filename</Label>
              <Input
                id="edit-filename"
                value={editFilename}
                onChange={(e) => setEditFilename(e.target.value)}
                placeholder="Clip name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Input
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="e.g. Sunset timelapse"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditItem(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
