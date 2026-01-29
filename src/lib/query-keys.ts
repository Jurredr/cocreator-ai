/**
 * Centralized query keys for TanStack Query.
 * Use these for useQuery/useMutation and queryClient.invalidateQueries.
 */
export const queryKeys = {
  me: {
    all: ["me"] as const,
    dashboard: () => [...queryKeys.me.all, "dashboard"] as const,
    channel: () => [...queryKeys.me.all, "channel"] as const,
    ideas: () => [...queryKeys.me.all, "ideas"] as const,
    idea: (id: string) => [...queryKeys.me.all, "ideas", id] as const,
    performance: () => [...queryKeys.me.all, "performance"] as const,
  },
  broll: () => ["broll"] as const,
} as const;
