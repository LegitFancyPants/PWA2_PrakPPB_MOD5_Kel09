import { useQuery } from '@tanstack/react-query'
import gunService from '../services/gunService'
import GUNS_LOCAL from '../data/guns'
import { queryKeys } from '../config/queryClient'

const EMPTY = []

// ---------------------------------------------------------------------------
// useGuns — fetch the paginated / filtered product list from the API.
//
// Returns { guns, loading, error, pagination, refetch, isFetching }.
// Results are cached per params via TanStack Query, so switching tabs or
// remounting the catalog re-uses the cached list instead of re-fetching.
// When the API is unreachable the `error` string will be set and `guns`
// will remain an empty array so the UI can show a proper error state.
// ---------------------------------------------------------------------------

export function useGuns(params = {}) {
  const query = useQuery({
    queryKey: queryKeys.gunList(params),
    queryFn: async () => {
      const response = await gunService.getGuns(params)
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch products.')
      }
      return response
    },
  })

  return {
    guns: query.data?.data || EMPTY,
    loading: query.isLoading,
    error: query.error
      ? query.error.message || 'An error occurred while fetching products.'
      : null,
    pagination: query.data?.pagination || null,
    refetch: query.refetch,
    isFetching: query.isFetching,
  }
}

// ---------------------------------------------------------------------------
// useGunById — fetch a single product by its id (also resolves local-N ids
// from the static catalog, so shared links to local items still work).
//
// `placeholder` lets the caller show an already-known product immediately
// while fresh details load in the background.
//
// Returns { gun, loading, error, refetch }.
// ---------------------------------------------------------------------------

export function useGunById(id, placeholder) {
  const query = useQuery({
    queryKey: queryKeys.gun(id),
    enabled: Boolean(id),
    placeholderData: placeholder || undefined,
    queryFn: async () => {
      if (String(id).startsWith('local-')) {
        const index = Number(String(id).slice('local-'.length))
        const local = GUNS_LOCAL[index]
        if (!local) throw new Error('Product not found.')
        return { ...local, id }
      }
      const response = await gunService.getGunById(id)
      if (!response.success) throw new Error(response.message || 'Product not found.')
      return response.data
    },
  })

  return {
    gun: query.data || null,
    loading: query.isLoading,
    error: query.error ? query.error.message || 'Failed to load product details.' : null,
    refetch: query.refetch,
  }
}
