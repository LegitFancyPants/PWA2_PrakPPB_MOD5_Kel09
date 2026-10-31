import { QueryClient } from '@tanstack/react-query'

// ---------------------------------------------------------------------------
// Query cache configuration (TanStack Query).
//
// Every server read goes through this client, so identical requests are
// de-duplicated and results are reused across pages instead of being
// re-fetched on every mount.
// ---------------------------------------------------------------------------
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // data is "fresh" for 1 minute → no refetch on remount
      gcTime: 10 * 60 * 1000, // unused cache entries are kept for 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// ---------------------------------------------------------------------------
// Centralised query keys — used by hooks to read and by mutations to
// invalidate the right cache entries.
// ---------------------------------------------------------------------------
export const queryKeys = {
  guns: ['guns'],
  gunList: (params) => ['guns', 'list', params],
  gun: (id) => ['guns', 'detail', String(id)],
  reviews: (gunId) => ['reviews', String(gunId)],
  reviewVotes: (gunId) => ['reviewVotes', String(gunId)],
  favorites: (userId) => ['favorites', userId],
  archive: ['archive'],
}
