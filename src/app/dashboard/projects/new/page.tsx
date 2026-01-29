"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/projects");
  }, [router]);
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <p className="text-muted-foreground text-sm">Redirecting to projects…</p>
    </div>
  );
}
