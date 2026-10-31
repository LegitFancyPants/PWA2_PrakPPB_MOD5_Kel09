import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { shareProduct } from '../../utils/share'

/**
 * Share a product's unique link — native share sheet when available,
 * otherwise the link is copied to the clipboard.
 *
 * @param {Object}  props
 * @param {Object}  props.gun
 * @param {boolean} [props.compact] — icon-only round button (cards)
 */
export default function ShareButton({ gun, compact = false }) {
  const [status, setStatus] = useState('')

  const handleClick = async (e) => {
    e.stopPropagation()
    try {
      const result = await shareProduct(gun)
      if (result === 'cancelled') return
      setStatus(result === 'copied' ? 'Link copied!' : 'Shared!')
    } catch {
      setStatus('Could not share')
    }
    setTimeout(() => setStatus(''), 2000)
  }

  const label = status || 'Share link'

  if (compact) {
    return (
      <button
        type="button"
        className="card-act-btn"
        onClick={handleClick}
        aria-label={`Share ${gun.name}`}
        title={label}
      >
        {status ? <Check size={15} color="var(--brass)" /> : <Share2 size={15} />}
      </button>
    )
  }

  return (
    <button type="button" className="btn btn--outline" onClick={handleClick} title="Share link">
      {status ? <Check size={16} color="var(--brass)" /> : <Share2 size={16} />} {label}
    </button>
  )
}
