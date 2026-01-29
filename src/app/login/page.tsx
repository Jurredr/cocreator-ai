import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-heading text-xl font-semibold"
        >
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
            <Sparkles className="size-4" />
          </div>
          Co-Creator AI
        </Link>
        <LoginForm />
        <p className="text-muted-foreground text-center text-xs">
          By signing in you agree to use Co-Creator AI for your content workflow.
        </p>
      </div>
    </div>
  );
}
