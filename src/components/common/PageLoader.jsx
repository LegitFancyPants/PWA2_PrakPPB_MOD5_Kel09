import { Loader } from 'lucide-react'

/**
 * Fallback shown while a lazily-loaded page chunk is downloading.
 */
export default function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="state-box" role="status" aria-live="polite">
      <Loader size={28} className="spin" />
      <p>{label}</p>
    </div>
  )
}
