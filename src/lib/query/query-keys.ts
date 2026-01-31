/**
 * Centralized query keys for TanStack Query.
 * Use these for useQuery/useMutation and queryClient.invalidateQueries.
 */
export const queryKeys = {
  me: {
    all: ["me"] as const,
    dashboard: () => [...queryKeys.me.all, "dashboard"] as const,
    channel: () => [...queryKeys.me.all, "channel"] as const,
    projects: () => [...queryKeys.me.all, "projects"] as const,
    project: (id: string) => [...queryKeys.me.all, "projects", id] as const,
    performance: () => [...queryKeys.me.all, "performance"] as const,
  },
  broll: () => ["broll"] as const,
} as const;
