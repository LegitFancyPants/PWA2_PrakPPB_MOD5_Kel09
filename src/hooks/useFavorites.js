import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import favoriteService from '../services/favoriteService'
import { getUserIdentifier } from '../services/userService'
import { queryKeys } from '../config/queryClient'

const EMPTY = []

// ---------------------------------------------------------------------------
// localStorage fallback — used when the backend is unavailable so that
// favourites are still fully functional offline.
// ---------------------------------------------------------------------------

const LOCAL_KEY = 'bore_barrel_favorites'

const readLocalFavs = () => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const writeLocalFavs = (ids) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(ids))
  } catch {
    /* quota exceeded — silently fail */
  }
}

// ---------------------------------------------------------------------------
// useFavorites — list all favourited product IDs.
//
// First attempts the server; on failure uses localStorage.
// The list is cached once and shared by the header badge, the favourites
// page and every FavoriteButton — one request instead of one per card.
// ---------------------------------------------------------------------------

export function useFavorites() {
  const userIdentifier = getUserIdentifier()

  const query = useQuery({
    queryKey: queryKeys.favorites(userIdentifier),
    queryFn: async () => {
      try {
        const response = await favoriteService.getFavorites(userIdentifier)
        if (response.success) {
          return { list: response.data || [], isLocal: false }
        }
        throw new Error(response.message)
      } catch {
        // Fallback to localStorage
        return { list: readLocalFavs(), isLocal: true }
      }
    },
  })

  return {
    favorites: query.data?.list || EMPTY,
    loading: query.isLoading,
    error: null,
    isLocal: Boolean(query.data?.isLocal),
    refetch: query.refetch,
  }
}

// ---------------------------------------------------------------------------
// useToggleFavorite — toggle a product in/out of favourites.
// ---------------------------------------------------------------------------

export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const userIdentifier = getUserIdentifier()

  const mutation = useMutation({
    mutationFn: async (gunId) => {
      try {
        const response = await favoriteService.toggleFavorite({
          recipe_id: gunId,
          user_identifier: userIdentifier,
        })

        if (response.success) {
          return response.data
        }
        throw new Error(response.message)
      } catch {
        // Fallback: toggle in localStorage
        const current = readLocalFavs()
        const idx = current.findIndex((id) => String(id) === String(gunId))
        let isFavorited

        if (idx === -1) {
          current.push(gunId)
          isFavorited = true
        } else {
          current.splice(idx, 1)
          isFavorited = false
        }
        writeLocalFavs(current)
        return { is_favorited: isFavorited }
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites(userIdentifier) }),
  })

  return {
    toggleFavorite: mutation.mutateAsync,
    loading: mutation.isPending,
    error: mutation.error,
  }
}

// ---------------------------------------------------------------------------
// useIsFavorited — convenience wrapper for a single product.
// ---------------------------------------------------------------------------

export function useIsFavorited(gunId) {
  const { favorites, loading: fetchLoading } = useFavorites()
  const { toggleFavorite: toggle, loading: toggleLoading } = useToggleFavorite()

  // Check both server-format (objects with .id) and local-format (plain ids)
  const isFavorited = favorites.some((fav) => {
    const favId = typeof fav === 'object' && fav !== null ? (fav.id ?? fav.product_id ?? fav.recipe_id) : fav
    return String(favId) === String(gunId)
  })

  const toggleFavorite = () => toggle(gunId)

  return {
    isFavorited,
    loading: fetchLoading || toggleLoading,
    toggleFavorite,
  }
}

export { getUserIdentifier }
