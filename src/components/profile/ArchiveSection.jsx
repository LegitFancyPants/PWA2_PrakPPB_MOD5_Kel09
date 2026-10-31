import { useState } from 'react'
import { Archive, RotateCcw, Trash2, Loader } from 'lucide-react'
import ConfirmModal from '../modals/ConfirmModal'
import { useArchive, useArchiveActions } from '../../hooks/useArchive'
import { formatPrice } from '../../utils/helpers'
import { formatDraftTime } from '../../utils/draftStorage'

/**
 * Archived (soft-deleted) products — restore them to the catalog or
 * delete them permanently.
 */
export default function ArchiveSection({ id }) {
  const { archived, loading } = useArchive()
  const { restoreGun, purgeGun, restoring, purging } = useArchiveActions()
  const [purgeTarget, setPurgeTarget] = useState(null)
  const [feedback, setFeedback] = useState({ type: '', text: '' })

  const flash = (type, text) => {
    setFeedback({ type, text })
    setTimeout(() => setFeedback({ type: '', text: '' }), 3000)
  }

  const handleRestore = async (gun) => {
    try {
      await restoreGun(gun)
      flash('success', `"${gun.name}" restored to the catalog.`)
    } catch (err) {
      flash('error', err.message || 'Failed to restore item.')
    }
  }

  const handlePurge = async () => {
    const gun = purgeTarget
    try {
      await purgeGun(gun)
      flash('success', `"${gun.name}" permanently deleted.`)
    } catch (err) {
      flash('error', err.message || 'Failed to delete item.')
    } finally {
      setPurgeTarget(null)
    }
  }

  return (
    <section id={id} className="profile-section">
      <div className="profile-section-head">
        <h3 className="section-title">
          <Archive size={18} /> Archive
        </h3>
        <span className="count">{archived.length} item{archived.length !== 1 ? 's' : ''}</span>
      </div>

      {feedback.text && (
        <div className={`toast toast--${feedback.type}`}>{feedback.text}</div>
      )}

      {loading ? (
        <p className="form-hint">
          <Loader size={14} className="spin" /> Loading archive…
        </p>
      ) : archived.length === 0 ? (
        <p className="form-hint">
          The archive is empty. Archiving an item in the catalog hides it without deleting it.
        </p>
      ) : (
        <ul className="mini-list">
          {archived.map((gun) => (
            <li key={gun.id} className="mini-item">
              <img
                className="mini-thumb"
                src={gun.image_url || gun.image || '/guns/pistol.svg'}
                alt=""
                loading="lazy"
                decoding="async"
              />
              <div className="mini-info">
                <span className="mini-title">{gun.name}</span>
                <span className="mini-sub">
                  <span className={`tag${gun.archiveSource === 'server' ? '' : ' tag--steel'}`}>
                    {gun.archiveSource === 'server' ? 'Server' : 'This device'}
                  </span>
                  {formatPrice(gun.price)} · archived {formatDraftTime(gun.archivedAt)}
                </span>
              </div>
              <div className="mini-actions">
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => handleRestore(gun)}
                  disabled={restoring || purging}
                >
                  <RotateCcw size={14} /> Restore
                </button>
                <button
                  type="button"
                  className="btn btn--danger-ghost"
                  onClick={() => setPurgeTarget(gun)}
                  disabled={restoring || purging}
                  aria-label={`Delete ${gun.name} permanently`}
                  title="Delete permanently"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={Boolean(purgeTarget)}
        title="Delete Permanently"
        message={`Permanently delete "${purgeTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete forever"
        danger
        loading={purging}
        onConfirm={handlePurge}
        onCancel={() => setPurgeTarget(null)}
      />
    </section>
  )
}
