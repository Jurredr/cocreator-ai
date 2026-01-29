import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getChannelByUserId, getPublishedContentByChannelId } from "@/lib/db/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddPublishedContentForm } from "@/components/add-published-content-form";
import { PublishedContentList } from "@/components/published-content-list";
import { BarChart3 } from "lucide-react";

export default async function PerformancePage() {
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
  const items = await getPublishedContentByChannelId(channel.id);

  return (
    <div className="flex flex-1 flex-col gap-8 p-6">
      <header>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Performance
        </h1>
        <p className="text-muted-foreground mt-1">
          Link published content and add manual metrics. Data model is ready for
          future API integrations.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <BarChart3 className="size-5" />
            Add published content
          </CardTitle>
          <CardDescription>
            Platform, URL, and optional metrics (views, likes, etc.). You can
            link to an idea if this content came from one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddPublishedContentForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Published content</CardTitle>
          <CardDescription>
            Your linked posts and their metrics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PublishedContentList items={items} />
        </CardContent>
      </Card>
    </div>
  );
}
