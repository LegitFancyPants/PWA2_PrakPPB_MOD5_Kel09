import { useState } from 'react'
import { Send, Loader } from 'lucide-react'
import StarPicker from './StarPicker'
import ReviewItem from './ReviewItem'
import ConfirmModal from '../modals/ConfirmModal'
import {
  useReviews,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
  useReviewVotes,
} from '../../hooks/useReviews'
import { getUserIdentifier } from '../../services/userService'

/**
 * Reviews for a product — full CRUD on the user's own reviews plus
 * thumbs up / thumbs down on every review.
 */
export default function ReviewSection({ gun }) {
  const userId = getUserIdentifier()
  const canReview = gun.id != null && !String(gun.id).startsWith('local-')

  const { reviews, loading } = useReviews(gun.id)
  const { createReview, loading: submitting } = useCreateReview(gun.id)
  const { updateReview, loading: updating } = useUpdateReview(gun.id)
  const { deleteReview, loading: deleting } = useDeleteReview(gun.id)
  const { votes, source: voteSource, vote } = useReviewVotes(gun.id, reviews)

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const flash = (msg) => {
    setFormSuccess(msg)
    setTimeout(() => setFormSuccess(''), 3000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')

    if (rating < 1 || rating > 5) {
      setFormError('Rating must be between 1 and 5.')
      return
    }

    const result = await createReview(gun.id, {
      user_identifier: userId,
      rating,
      comment: comment.trim(),
    })

    if (result) {
      setComment('')
      setRating(5)
      flash('Review submitted!')
    } else {
      setFormError('Could not submit review. The server may be unavailable.')
    }
  }

  const handleUpdate = async (review, data) => {
    const result = await updateReview(review.id, { user_identifier: userId, ...data })
    if (result) flash('Review updated.')
    return Boolean(result)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const result = await deleteReview(deleteTarget.id)
    setDeleteTarget(null)
    if (result) flash('Review deleted.')
    else setFormError('Could not delete review. Please try again.')
  }

  return (
    <section className="detail-section">
      <h2>Reviews</h2>

      {/* Create review */}
      <form className="review-form" onSubmit={handleSubmit}>
        <StarPicker value={rating} onChange={setRating} />

        <textarea
          className="review-input"
          rows="3"
          placeholder="Write a short review (optional)…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          aria-label="Review comment"
        />

        <button type="submit" className="btn btn--primary" disabled={submitting || !canReview}>
          {submitting ? (
            <><Loader size={16} className="spin" /> Submitting…</>
          ) : (
            <><Send size={16} /> Submit Review</>
          )}
        </button>

        {formError && <p className="form-error">{formError}</p>}
        {formSuccess && <p className="form-success">{formSuccess}</p>}
        {!canReview && (
          <p className="form-hint">
            Reviews require a server-generated product ID. This product is local-only.
          </p>
        )}
      </form>

      {/* Existing reviews */}
      {loading ? (
        <p className="detail-loading">Loading reviews…</p>
      ) : reviews.length > 0 ? (
        <>
          <ul className="review-list">
            {reviews.map((rev) => (
              <ReviewItem
                key={rev.id}
                review={rev}
                isMine={rev.user_id === userId}
                tally={votes[String(rev.id)]}
                onVote={(value) => vote(rev.id, value)}
                onUpdate={(data) => handleUpdate(rev, data)}
                onDelete={() => setDeleteTarget(rev)}
                saving={updating}
              />
            ))}
          </ul>
          {voteSource === 'local' && (
            <p className="form-hint">
              Votes are stored on this device (server vote table not available).
            </p>
          )}
        </>
      ) : (
        <p className="detail-empty">No reviews yet. Be the first!</p>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Review"
        message="Delete your review? This cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  )
}
