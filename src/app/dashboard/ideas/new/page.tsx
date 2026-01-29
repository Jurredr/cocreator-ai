import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getChannelByUserId } from "@/lib/db/queries";
import { GenerateIdeasForm } from "@/components/generate-ideas-form";
import { SaveIdeaForm } from "@/components/save-idea-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewIdeaPage() {
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

  return (
    <div className="flex flex-1 flex-col gap-8 p-6">
      <header>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Generate idea
        </h1>
        <p className="text-muted-foreground mt-1">
          Get AI-generated ideas based on your channel and buckets, or add your
          own idea.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">AI-generated ideas</CardTitle>
          <CardDescription>
            Click to generate 3 ideas. Pick one to save, or refine and add
            manually below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GenerateIdeasForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Add your own idea</CardTitle>
          <CardDescription>
            Write an idea and save it to generate title, description, hashtags,
            script, and hooks from it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SaveIdeaForm />
        </CardContent>
      </Card>
    </div>
  );
}
