import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import archiveService from '../services/archiveService'
import { queryKeys } from '../config/queryClient'

const EMPTY = []

// ---------------------------------------------------------------------------
// useArchive — list of archived (soft-deleted) products.
// ---------------------------------------------------------------------------

export function useArchive() {
  const query = useQuery({
    queryKey: queryKeys.archive,
    queryFn: () => archiveService.getArchived(),
  })

  return {
    archived: query.data || EMPTY,
    loading: query.isLoading,
    error: query.error ? query.error.message || 'Failed to load archive.' : null,
    refetch: query.refetch,
  }
}

// ---------------------------------------------------------------------------
// useArchivedIds — Set of archived product ids, for hiding them in lists.
// ---------------------------------------------------------------------------

export function useArchivedIds() {
  const { archived } = useArchive()
  return useMemo(() => new Set(archived.map((g) => String(g.id))), [archived])
}

// ---------------------------------------------------------------------------
// useArchiveActions — archive / restore / permanently delete a product.
// Every action refreshes the catalog, product details and the archive list.
// ---------------------------------------------------------------------------

export function useArchiveActions() {
  const queryClient = useQueryClient()

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.guns }),
      queryClient.invalidateQueries({ queryKey: queryKeys.archive }),
      queryClient.invalidateQueries({ queryKey: ['favorites'] }),
    ])

  const archive = useMutation({
    mutationFn: (gun) => archiveService.archiveGun(gun),
    onSettled: refresh,
  })
  const restore = useMutation({
    mutationFn: (gun) => archiveService.restoreGun(gun),
    onSettled: refresh,
  })
  const purge = useMutation({
    mutationFn: (gun) => archiveService.purgeGun(gun),
    onSettled: refresh,
  })

  return {
    archiveGun: archive.mutateAsync,
    restoreGun: restore.mutateAsync,
    purgeGun: purge.mutateAsync,
    archiving: archive.isPending,
    restoring: restore.isPending,
    purging: purge.isPending,
  }
}
