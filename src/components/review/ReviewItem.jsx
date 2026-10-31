import { useState } from 'react'
import { Star, ThumbsUp, ThumbsDown, Pencil, Trash2, Loader, Save, X } from 'lucide-react'
import StarPicker from './StarPicker'

const formatDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString()
}

/**
 * A single review with thumbs up/down, and inline edit / delete when the
 * review belongs to the current user.
 *
 * @param {Object}   props
 * @param {Object}   props.review
 * @param {boolean}  props.isMine
 * @param {Object}   props.tally      — { up, down, mine }
 * @param {Function} props.onVote     — (value: 1 | -1 | 0) => void
 * @param {Function} props.onUpdate   — ({ rating, comment }) => Promise<boolean>
 * @param {Function} props.onDelete   — () => void (opens confirmation)
 * @param {boolean}  [props.saving]
 */
export default function ReviewItem({ review, isMine, tally, onVote, onUpdate, onDelete, saving }) {
  const [editing, setEditing] = useState(false)
  const [rating, setRating] = useState(review.rating)
  const [comment, setComment] = useState(review.comment || '')
  const [error, setError] = useState('')

  const { up = 0, down = 0, mine = 0 } = tally || {}

  const startEdit = () => {
    setRating(review.rating)
    setComment(review.comment || '')
    setError('')
    setEditing(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const ok = await onUpdate({ rating, comment: comment.trim() })
    if (ok) setEditing(false)
    else setError('Could not update review. Please try again.')
  }

  return (
    <li className={`review-item${isMine ? ' review-item--mine' : ''}`}>
      <div className="review-head">
        <span className="review-user">
          {review.user_identifier || 'Anonymous'}
          {isMine && <span className="review-you">You</span>}
        </span>
        {!editing && (
          <span className="review-stars-display" aria-label={`${review.rating} of 5 stars`}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={14}
                fill={i < review.rating ? 'var(--brass)' : 'none'}
                stroke={i < review.rating ? 'var(--brass)' : 'var(--line)'}
              />
            ))}
          </span>
        )}
      </div>

      {editing ? (
        <form className="review-edit-form" onSubmit={handleSave}>
          <StarPicker value={rating} onChange={setRating} size={20} />
          <textarea
            className="review-input"
            rows="3"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            aria-label="Edit review comment"
          />
          <div className="review-edit-actions">
            <button type="submit" className="btn btn--primary btn--sm" disabled={saving}>
              {saving ? <Loader size={14} className="spin" /> : <Save size={14} />} Save
            </button>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              <X size={14} /> Cancel
            </button>
          </div>
          {error && <p className="form-error">{error}</p>}
        </form>
      ) : (
        review.comment && <p className="review-comment">{review.comment}</p>
      )}

      <div className="review-foot">
        <span className="review-date">{formatDate(review.created_at)}</span>

        <div className="review-votes">
          <button
            type="button"
            className={`vote-btn${mine === 1 ? ' vote-btn--active' : ''}`}
            onClick={() => onVote(mine === 1 ? 0 : 1)}
            aria-pressed={mine === 1}
            aria-label="Thumbs up"
            title="Helpful"
          >
            <ThumbsUp size={14} /> {up}
          </button>
          <button
            type="button"
            className={`vote-btn${mine === -1 ? ' vote-btn--active vote-btn--down' : ''}`}
            onClick={() => onVote(mine === -1 ? 0 : -1)}
            aria-pressed={mine === -1}
            aria-label="Thumbs down"
            title="Not helpful"
          >
            <ThumbsDown size={14} /> {down}
          </button>

          {isMine && !editing && (
            <>
              <button type="button" className="vote-btn" onClick={startEdit} title="Edit review">
                <Pencil size={14} /> Edit
              </button>
              <button
                type="button"
                className="vote-btn vote-btn--danger"
                onClick={onDelete}
                title="Delete review"
              >
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  )
}
