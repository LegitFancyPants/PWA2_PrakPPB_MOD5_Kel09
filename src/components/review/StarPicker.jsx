import { Star } from 'lucide-react'

/**
 * Clickable 1–5 star rating input.
 */
export default function StarPicker({ value, onChange, size = 22 }) {
  return (
    <div className="review-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className="star-btn"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          aria-pressed={n <= value}
        >
          <Star
            size={size}
            fill={n <= value ? 'var(--brass)' : 'none'}
            stroke={n <= value ? 'var(--brass)' : 'var(--steel)'}
          />
        </button>
      ))}
    </div>
  )
}
