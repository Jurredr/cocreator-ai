"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewIdeaRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/ideas");
  }, [router]);
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <p className="text-muted-foreground text-sm">Redirecting to projects…</p>
    </div>
  );
}
