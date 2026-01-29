"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function LoginForm() {
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="google-signin" className="font-heading text-base">
          Sign in with Google
        </Label>
        <Button
          id="google-signin"
          type="button"
          variant="outline"
          className="w-full"
          onClick={signInWithGoogle}
          disabled={loading}
        >
          {loading ? "Redirecting…" : "Continue with Google"}
        </Button>
      </div>
    </div>
  );
}
