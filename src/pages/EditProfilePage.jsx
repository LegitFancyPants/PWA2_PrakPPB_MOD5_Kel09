import { useState } from 'react'
import { ArrowLeft, Save, X } from 'lucide-react'
import userService from '../services/userService'

const NAME_MAX = 40
const BIO_MAX = 200

/**
 * EditProfilePage — dedicated page for editing the user's name and bio.
 *
 * @param {Object}   props
 * @param {Function} props.onBack   — return to profile without saving
 * @param {Function} props.onSaved  — called with the saved profile
 */
export default function EditProfilePage({ onBack, onSaved }) {
  const [initial] = useState(() => userService.getUserProfile())
  const [username, setUsername] = useState(initial.username || '')
  const [bio, setBio] = useState(initial.bio || '')
  const [error, setError] = useState('')

  const isDirty = username !== (initial.username || '') || bio !== (initial.bio || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    const name = username.trim()
    if (!name) {
      setError('Name cannot be empty.')
      return
    }

    const result = userService.saveUserProfile({ ...initial, username: name, bio: bio.trim() })
    if (result.success) {
      onSaved(result.data)
    } else {
      setError('Failed to save profile.')
    }
  }

  const handleCancel = () => {
    if (isDirty && !window.confirm('Discard your unsaved changes?')) return
    onBack()
  }

  return (
    <div className="form-page">
      <button type="button" className="detail-back" onClick={handleCancel}>
        <ArrowLeft size={18} /> Back to Profile
      </button>

      <section className="masthead">
        <h1 className="display">Edit Profile</h1>
        <p className="lede">Update the name and bio shown on your operator profile.</p>
      </section>

      <form onSubmit={handleSubmit} className="profile-form" noValidate>
        {error && <div className="toast toast--error">{error}</div>}

        <div className="form-group">
          <label htmlFor="edit-prof-name" className="form-label">
            Name / Callsign <span className="req">*</span>
          </label>
          <input
            id="edit-prof-name"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. Operator Delta, Master Gunsmith"
            className="form-input"
            maxLength={NAME_MAX}
            required
            autoFocus
          />
          <span className="form-hint">{username.length}/{NAME_MAX}</span>
        </div>

        <div className="form-group">
          <label htmlFor="edit-prof-bio" className="form-label">
            Bio
          </label>
          <textarea
            id="edit-prof-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Qualifications, preferred calibers, unit assignment..."
            rows={4}
            className="form-textarea"
            maxLength={BIO_MAX}
          />
          <span className="form-hint">{bio.length}/{BIO_MAX}</span>
        </div>

        <div className="form-actions-bar">
          <button type="button" className="btn btn--outline" onClick={handleCancel}>
            <X size={16} /> Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={!isDirty}>
            <Save size={16} /> Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}
