"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useRedirectOnUnauthorized(
  isError: boolean,
  error: Error | null,
  redirectTo = "/login"
) {
  const router = useRouter();
  useEffect(() => {
    if (!isError || !error) return;
    const err = error as Error & { status?: number };
    if (err.message === "Unauthorized" || err.status === 401) {
      router.replace(redirectTo);
    }
  }, [isError, error, router, redirectTo]);
}
