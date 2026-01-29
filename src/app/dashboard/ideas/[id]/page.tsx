"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function IdeaRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  useEffect(() => {
    router.replace(`/dashboard/projects/${id}`);
  }, [router, id]);
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <p className="text-muted-foreground text-sm">Redirecting to project…</p>
    </div>
  );
}
