import { AlertCircle, ArrowLeft } from 'lucide-react'
import GunDetail from '../components/gun/GunDetail'
import PageLoader from '../components/common/PageLoader'
import { useGunById } from '../hooks/useGuns'
import { useArchivedIds } from '../hooks/useArchive'
import { isGunArchived } from '../utils/helpers'

/**
 * Product detail resolved by id — used both when a card is clicked (the
 * known product is shown instantly as placeholder data) and when the app
 * is opened from a shared link (?product=<id>).
 */
export default function ProductDetailPage({ gunId, initialGun, onBack, onEdit, onDelete }) {
  const { gun, loading, error } = useGunById(gunId, initialGun)
  const archivedIds = useArchivedIds()

  if (loading && !gun) return <PageLoader label="Loading product…" />

  if (!gun) {
    return (
      <div className="detail">
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Back to Catalog
        </button>
        <div className="state-box state-box--error">
          <AlertCircle size={28} />
          <p>{error || 'Product not found.'} The shared link may be invalid.</p>
        </div>
      </div>
    )
  }

  return (
    <GunDetail
      gun={gun}
      archived={isGunArchived(gun, archivedIds)}
      onBack={onBack}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}
