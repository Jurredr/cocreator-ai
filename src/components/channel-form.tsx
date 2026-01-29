"use client";

import { createOrUpdateChannel } from "@/app/dashboard/channel/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { channels } from "@/lib/db/schema";

type Channel = typeof channels.$inferSelect;

export function ChannelForm({ channel }: { channel?: Channel | null }) {
  const formAction = async (formData: FormData) => {
    const result = await createOrUpdateChannel(formData);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Channel saved");
  };

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Channel name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={channel?.name ?? ""}
          placeholder="My Channel"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="coreAudience">Core audience</Label>
        <Input
          id="coreAudience"
          name="coreAudience"
          defaultValue={channel?.coreAudience ?? ""}
          placeholder="Who is your content for?"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="goals">Goals</Label>
        <textarea
          id="goals"
          name="goals"
          defaultValue={channel?.goals ?? ""}
          placeholder="What do you want to achieve with your channel?"
          rows={3}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <Button type="submit">Save channel</Button>
    </form>
  );
}
