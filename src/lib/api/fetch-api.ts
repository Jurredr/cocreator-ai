/**
 * Fetch JSON from an API route. Throws on 401 (caller should redirect to login)
 * or non-OK response (throws with message from body or statusText).
 */
export async function fetchApi<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (res.status === 401) {
    const err = new Error("Unauthorized") as Error & { status?: number };
    err.status = 401;
    throw err;
  }
  if (res.status === 400) {
    const data = await res.json().catch(() => ({}));
    const err = new Error((data as { error?: string }).error ?? "Bad request") as Error & { status?: number };
    err.status = 400;
    throw err;
  }
  if (res.status === 404) {
    const err = new Error("Not found") as Error & { status?: number };
    err.status = 404;
    throw err;
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}
