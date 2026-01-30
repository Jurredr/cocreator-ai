"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BrollUpload } from "@/components/broll-upload";
import { BrollList } from "@/components/broll-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryKeys } from "@/lib/query-keys";
import { fetchApi } from "@/lib/fetch-api";
import { useRedirectOnUnauthorized } from "@/lib/use-redirect-unauthorized";
import { ImagePlus, Video } from "lucide-react";

type BrollItem = {
  id: string;
  filename: string;
  thumbnailDataUrl: string;
  description: string | null;
  recordingDate: string | null;
  mediaType: "video" | "image";
  orientation: "vertical" | "horizontal" | null;
  source: "uploaded" | "ai_generated";
  projectId: string | null;
  createdAt: string;
};

export default function BrollPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data: rawItems = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.broll(),
    queryFn: () => fetchApi<BrollItem[]>("/api/broll"),
  });

  useRedirectOnUnauthorized(isError, error ?? null);

  useEffect(() => {
    if (isError && error && (error as Error & { status?: number }).status === 400) {
      router.replace("/dashboard");
    }
  }, [isError, error, router]);

  const invalidateBroll = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.broll() });
  };

  const items = (rawItems ?? []).map((item) => ({
    ...item,
    mediaType: item.mediaType ?? "video",
    orientation: item.orientation ?? null,
    source: item.source ?? "uploaded",
    projectId: item.projectId ?? null,
  }));

  async function handleDelete(id: string) {
    const key = queryKeys.broll();
    const previous = queryClient.getQueryData<BrollItem[]>(key);
    queryClient.setQueryData<BrollItem[]>(key, (old) =>
      (old ?? []).filter((item) => item.id !== id)
    );
    try {
      const res = await fetch(`/api/broll/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete");
      }
    } catch (err) {
      queryClient.setQueryData(key, previous);
      throw err;
    }
  }

  async function handleEdit(
    id: string,
    updates: {
      filename?: string;
      description?: string;
      orientation?: "vertical" | "horizontal" | null;
    }
  ) {
    const res = await fetch(`/api/broll/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Failed to update");
    }
    invalidateBroll();
  }

  const uploadedItems = useMemo(
    () => items.filter((i) => (i.source ?? "uploaded") === "uploaded"),
    [items]
  );
  const aiGeneratedItems = useMemo(
    () => items.filter((i) => i.source === "ai_generated"),
    [items]
  );
  const [activeTab, setActiveTab] = useState<string>("uploaded");

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-8 p-6">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-6">
      <header>
        <h1 className="font-heading text-3xl font-semibold">
          Media library
        </h1>
        <p className="text-muted-foreground mt-1">
          Videos and images for your content: B-roll, thumbnails, and post
          assets. Upload videos (vertical 9:16 or horizontal 16:9) and images.
          Only thumbnails/previews are stored (client-side extraction).
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Add media</CardTitle>
          <CardDescription>
            Select a video or image. For videos, choose orientation (9:16 or
            16:9). A thumbnail or compressed image is stored in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BrollUpload onSuccess={invalidateBroll} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Library</CardTitle>
          <CardDescription>
            Your media. Use for scripts, thumbnails, and textual posts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-xs grid-cols-2">
              <TabsTrigger value="uploaded" className="gap-1.5">
                <Video className="size-3.5" />
                Uploaded
              </TabsTrigger>
              <TabsTrigger value="ai-generated" className="gap-1.5">
                <ImagePlus className="size-3.5" />
                AI-generated
              </TabsTrigger>
            </TabsList>
            <TabsContent value="uploaded" className="mt-4">
              <BrollList
                items={uploadedItems}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            </TabsContent>
            <TabsContent value="ai-generated" className="mt-4">
              {aiGeneratedItems.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  AI-generated images from projects will appear here. Add images
                  from your project canvas when that feature is available.
                </p>
              ) : (
                <BrollList
                  items={aiGeneratedItems}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
