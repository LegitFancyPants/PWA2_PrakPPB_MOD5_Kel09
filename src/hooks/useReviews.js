import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import reviewService from '../services/reviewService'
import reviewVoteService from '../services/reviewVoteService'
import { getUserIdentifier } from '../services/userService'
import { queryKeys } from '../config/queryClient'

const EMPTY = []

const canHaveReviews = (gunId) => Boolean(gunId) && !String(gunId).startsWith('local-')

// ---------------------------------------------------------------------------
// useReviews — fetch reviews for a specific product (cached per product).
// ---------------------------------------------------------------------------

export function useReviews(gunId) {
  const query = useQuery({
    queryKey: queryKeys.reviews(gunId),
    enabled: canHaveReviews(gunId),
    queryFn: async () => {
      const response = await reviewService.getReviews(gunId)
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch reviews.')
      }
      return response.data || []
    },
  })

  return {
    reviews: query.data || EMPTY,
    loading: query.isLoading,
    error: query.error
      ? query.error.message || 'An error occurred while fetching reviews.'
      : null,
    refetch: query.refetch,
  }
}

// ---------------------------------------------------------------------------
// Shared mutation wrapper — keeps the { fn, loading, error, success } shape
// the components already use, and refreshes the product's reviews afterwards.
// ---------------------------------------------------------------------------

function useReviewMutation(gunId, mutationFn, fallbackMessage) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (args) => {
      const response = await mutationFn(args)
      if (!response.success) throw new Error(response.message || fallbackMessage)
      return response.data ?? true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews(gunId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.reviewVotes(gunId) })
    },
  })

  const run = async (args) => {
    try {
      return await mutation.mutateAsync(args)
    } catch {
      return null
    }
  }

  return {
    run,
    loading: mutation.isPending,
    error: mutation.error ? mutation.error.message || fallbackMessage : null,
    success: mutation.isSuccess,
  }
}

// ---------------------------------------------------------------------------
// useCreateReview — submit a new review for a product.
// ---------------------------------------------------------------------------

export function useCreateReview(gunId) {
  const { run, ...state } = useReviewMutation(
    gunId,
    ({ id, data }) => reviewService.createReview(id, data),
    'Failed to submit review.',
  )
  const createReview = (id, reviewData) => run({ id, data: reviewData })
  return { createReview, ...state }
}

// ---------------------------------------------------------------------------
// useUpdateReview — edit the rating / comment of an existing review.
// ---------------------------------------------------------------------------

export function useUpdateReview(gunId) {
  const { run, ...state } = useReviewMutation(
    gunId,
    ({ reviewId, data }) => reviewService.updateReview(reviewId, data),
    'Failed to update review.',
  )
  const updateReview = (reviewId, reviewData) => run({ reviewId, data: reviewData })
  return { updateReview, ...state }
}

// ---------------------------------------------------------------------------
// useDeleteReview — remove a review.
// ---------------------------------------------------------------------------

export function useDeleteReview(gunId) {
  const { run, ...state } = useReviewMutation(
    gunId,
    (reviewId) => reviewService.deleteReview(reviewId, getUserIdentifier()),
    'Failed to delete review.',
  )
  return { deleteReview: run, ...state }
}

// ---------------------------------------------------------------------------
// useReviewVotes — thumbs up / down counts for every review of a product,
// plus a `vote(reviewId, value)` action (1 = up, -1 = down, 0 = clear).
// ---------------------------------------------------------------------------

export function useReviewVotes(gunId, reviews) {
  const queryClient = useQueryClient()
  const userId = getUserIdentifier()
  const reviewIds = reviews.map((r) => r.id).filter((id) => id != null)
  const key = queryKeys.reviewVotes(gunId)

  const query = useQuery({
    queryKey: [...key, reviewIds.join(',')],
    enabled: reviewIds.length > 0,
    queryFn: () => reviewVoteService.getVotes(reviewIds, userId),
  })

  const mutation = useMutation({
    mutationFn: ({ reviewId, value }) => reviewVoteService.vote(reviewId, userId, value),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })

  return {
    votes: query.data?.votes || {},
    source: query.data?.source || 'local',
    vote: (reviewId, value) => mutation.mutateAsync({ reviewId, value }),
    voting: mutation.isPending,
  }
}
