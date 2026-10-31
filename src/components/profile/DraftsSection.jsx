import { useState } from 'react'
import { FileText, Pencil, Trash2 } from 'lucide-react'
import ConfirmModal from '../modals/ConfirmModal'
import { listDrafts, deleteDraft, formatDraftTime } from '../../utils/draftStorage'

/**
 * Every unsaved Create / Edit form draft stored on this device, with
 * "Continue" (re-open the form) and "Delete" actions.
 *
 * @param {Object}   props
 * @param {string}   props.id            — anchor id for the section
 * @param {Function} props.onOpenDraft   — (draftId) => void
 * @param {Function} [props.onChange]    — called after a draft is removed
 */
export default function DraftsSection({ id, onOpenDraft, onChange }) {
  const [drafts, setDrafts] = useState(listDrafts)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const handleDelete = () => {
    deleteDraft(deleteTarget.id)
    setDrafts(listDrafts())
    setDeleteTarget(null)
    if (onChange) onChange()
  }

  return (
    <section id={id} className="profile-section">
      <div className="profile-section-head">
        <h3 className="section-title">
          <FileText size={18} /> Drafts
        </h3>
        <span className="count">{drafts.length} saved</span>
      </div>

      {drafts.length === 0 ? (
        <p className="form-hint">
          No drafts yet. Use “Save Draft” on the Add / Edit hardware form to keep unfinished work here.
        </p>
      ) : (
        <ul className="mini-list">
          {drafts.map((draft) => (
            <li key={draft.id} className="mini-item">
              <img
                className="mini-thumb"
                src={draft.imageUrl || '/guns/pistol.svg'}
                alt=""
                loading="lazy"
                decoding="async"
              />
              <div className="mini-info">
                <span className="mini-title">{draft.name || 'Untitled hardware'}</span>
                <span className="mini-sub">
                  <span className={`tag${draft.isCreate ? '' : ' tag--steel'}`}>
                    {draft.isCreate ? 'New item' : `Edit #${draft.id}`}
                  </span>
                  {[draft.type, draft.caliber].filter(Boolean).join(' · ')}
                  {draft.savedAt ? ` · ${formatDraftTime(draft.savedAt)}` : ''}
                </span>
              </div>
              <div className="mini-actions">
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => onOpenDraft(draft.id)}
                >
                  <Pencil size={14} /> Continue
                </button>
                <button
                  type="button"
                  className="btn btn--danger-ghost"
                  onClick={() => setDeleteTarget(draft)}
                  aria-label={`Delete draft ${draft.name || draft.id}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Draft"
        message={`Delete the draft "${deleteTarget?.name || 'Untitled hardware'}"?`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  )
}
