import { ArrowLeft, Star, Archive } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import ShareButton from '../common/ShareButton'
import AddToCartButton from '../common/AddToCartButton'
import ReviewSection from '../review/ReviewSection'
import { useReviews } from '../../hooks/useReviews'
import { formatPrice, averageRating } from '../../utils/helpers'

/**
 * Full-screen product detail view.
 *
 * @param {Object}   props
 * @param {Object}   props.gun       — product data
 * @param {Function} props.onBack    — return to catalog
 * @param {Function} [props.onEdit]  — navigate to edit page
 * @param {Function} [props.onDelete]— trigger archive (soft delete) flow
 * @param {boolean}  [props.archived]— product is in the archive
 */
export default function GunDetail({ gun, onBack, onEdit, onDelete, archived = false }) {
  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  // Same cached query as ReviewSection — no extra request.
  const { reviews } = useReviews(gun.id)

  const avgRating = gun.average_rating || averageRating(reviews)
  const reviewCount = gun.review_count ?? reviews.length

  return (
    <div className="detail">
      {/* Back button */}
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to Catalog
      </button>

      {archived && (
        <div className="toast toast--error">
          <Archive size={18} /> This item is archived and hidden from the catalog.
        </div>
      )}

      {/* Hero */}
      <div className="detail-hero">
        <img className="detail-img" src={imgSrc} alt={gun.name} loading="lazy" decoding="async" />
        <div className="detail-info">
          <h1 className="display">{gun.name}</h1>
          <p className="type">
            {category}
            {caliber ? ` · ${caliber}` : ''}
          </p>
          <p className="price detail-price">{formatPrice(price)}</p>

          {avgRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </p>
          )}

          <div className="detail-actions">
            {!archived && <AddToCartButton gun={gun} />}
            <FavoriteButton gunId={gun.id || gun.name} />
            {gun.id != null && <ShareButton gun={gun} />}
          </div>

          {(onEdit || onDelete) && !archived && (
            <div className="detail-actions">
              {onEdit && (
                <button type="button" className="btn btn--outline" onClick={() => onEdit(gun)}>
                  Edit
                </button>
              )}
              {onDelete && (
                <button type="button" className="btn btn--danger" onClick={() => onDelete(gun)}>
                  <Archive size={16} /> Archive
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <section className="detail-section">
        <h2>Description</h2>
        <p>{gun.description || 'No description available.'}</p>
      </section>

      {/* Specifications (from ingredients / steps if present) */}
      {gun.ingredients && gun.ingredients.length > 0 && (
        <section className="detail-section">
          <h2>Specifications</h2>
          <ul className="detail-specs">
            {gun.ingredients.map((ing, i) => (
              <li key={ing.id || i}>
                <strong>{ing.name}</strong> — {ing.quantity}
              </li>
            ))}
          </ul>
        </section>
      )}

      {gun.steps && gun.steps.length > 0 && (
        <section className="detail-section">
          <h2>Assembly / Maintenance Steps</h2>
          <ol className="detail-steps">
            {gun.steps.map((step, i) => (
              <li key={step.id || i}>
                {step.instruction || step}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Reviews — create / read / update / delete + thumbs up & down */}
      <ReviewSection gun={gun} />
    </div>
  )
}
