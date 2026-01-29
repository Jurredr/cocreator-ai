import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getChannelByUserId, getBrollByChannelId } from "@/lib/db/queries";
import { BrollUpload } from "@/components/broll-upload";
import { BrollList } from "@/components/broll-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BrollPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  const channel = await getChannelByUserId(user.id);
  if (!channel) {
    redirect("/dashboard");
  }
  const items = await getBrollByChannelId(channel.id);

  return (
    <div className="flex flex-1 flex-col gap-8 p-6">
      <header>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          B-roll library
        </h1>
        <p className="text-muted-foreground mt-1">
          Add video files to extract a thumbnail and description. Videos are
          not uploaded—only a thumbnail is stored (client-side extraction).
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Add B-roll</CardTitle>
          <CardDescription>
            Select a video file. A thumbnail will be extracted in your browser
            and stored with the filename and optional description.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BrollUpload />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Library</CardTitle>
          <CardDescription>
            Your B-roll clips. Use these when generating scripts or ideas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BrollList items={items} />
        </CardContent>
      </Card>
    </div>
  );
}
