import { useEffect, useState } from 'react'
import {
  Shield,
  Copy,
  Check,
  Heart,
  FileText,
  Camera,
  Play,
  Pencil,
  Archive,
  ShoppingCart,
} from 'lucide-react'
import userService from '../services/userService'
import { useFavorites } from '../hooks/useFavorites'
import { useArchive } from '../hooks/useArchive'
import { useCart } from '../hooks/useCart'
import { getAllDraftIds } from '../utils/draftStorage'
import DraftsSection from '../components/profile/DraftsSection'
import ArchiveSection from '../components/profile/ArchiveSection'
import AboutSection from '../components/profile/AboutSection'
import ContactSection from '../components/profile/ContactSection'

const SECTIONS = [
  { id: 'profile-overview', label: 'Overview' },
  { id: 'profile-drafts', label: 'Drafts' },
  { id: 'profile-archive', label: 'Archive' },
  { id: 'profile-about', label: 'About' },
  { id: 'profile-contact', label: 'Contact' },
]

/**
 * ProfilePage — User identity and Armory settings.
 * Sections: overview (identity + stats), drafts, archive, about, contact.
 * Name & bio are edited on the dedicated EditProfilePage.
 *
 * @param {Object}   props
 * @param {Function} [props.onReplaySplash]
 * @param {Function} props.onEditProfile     — open EditProfilePage
 * @param {Function} props.onOpenDraft       — (draftId) => open Create / Edit form
 * @param {string}   [props.notice]          — one-off success message
 * @param {Function} [props.onNoticeShown]
 */
export default function ProfilePage({
  onReplaySplash,
  onEditProfile,
  onOpenDraft,
  notice,
  onNoticeShown,
}) {
  const [profile] = useState(() => userService.getUserProfile())
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState(notice || '')

  const { favorites } = useFavorites()
  const { archived } = useArchive()
  const { count: cartCount } = useCart()
  const [draftCount, setDraftCount] = useState(() => getAllDraftIds().length)

  // Show a message handed over by another page (e.g. after editing).
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => {
      setFeedback('')
      if (onNoticeShown) onNoticeShown()
    }, 3000)
    return () => clearTimeout(t)
  }, [notice, onNoticeShown])

  const flash = (msg) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(''), 3000)
  }

  const handleCopyId = () => {
    if (profile.userId) {
      navigator.clipboard.writeText(profile.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      flash('Avatar image must be under 2MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target.result
      setAvatar(base64)
      userService.updateAvatar(base64)
      flash('Avatar updated.')
    }
    reader.readAsDataURL(file)
  }

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="profile-page">
      <section className="masthead" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="display">Operator Profile</h1>
          <p className="lede">
            Operator credentials, drafts, archive, and shop information.
          </p>
        </div>
        {onReplaySplash && (
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={onReplaySplash}
            title="Replay introductory splash animation"
          >
            <Play size={14} /> Replay Intro
          </button>
        )}
      </section>

      {/* In-page section navigation */}
      <nav className="profile-subnav" aria-label="Profile sections">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className="pill"
            onClick={() => scrollToSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {feedback && (
        <div className="toast toast--success">
          <Check size={18} /> {feedback}
        </div>
      )}

      {/* Operator Card */}
      <div id="profile-overview" className="profile-card profile-section-anchor">
        <div className="profile-card-top">
          <div className="avatar-wrap">
            {avatar ? (
              <img src={avatar} alt={profile.username} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <Shield size={36} stroke="var(--brass)" />
              </div>
            )}
            <label htmlFor="avatar-file-input" className="avatar-upload-btn" title="Upload avatar">
              <Camera size={14} />
              <input
                id="avatar-file-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden-file-input"
              />
            </label>
          </div>

          <div className="profile-identity">
            <h2 className="display">{profile.username || 'Shooter'}</h2>
            <div className="profile-id-row">
              <span className="mono-badge">{profile.userId}</span>
              <button
                type="button"
                className="icon-btn"
                onClick={handleCopyId}
                title="Copy User ID to clipboard"
              >
                {copied ? <Check size={14} color="var(--brass)" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        <div className="profile-bio">
          {profile.bio ? (
            <p>{profile.bio}</p>
          ) : (
            <p className="form-hint">No bio yet.</p>
          )}
          <button type="button" className="btn btn--outline btn--sm" onClick={onEditProfile}>
            <Pencil size={14} /> Edit Profile
          </button>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats">
          <div className="stat-item">
            <Heart size={20} className="stat-icon" stroke="var(--brass)" />
            <div className="stat-val">{favorites.length}</div>
            <div className="stat-label">Procurement Favorites</div>
          </div>
          <div className="stat-item">
            <FileText size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{draftCount}</div>
            <div className="stat-label">Saved Offline Drafts</div>
          </div>
          <div className="stat-item">
            <Archive size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{archived.length}</div>
            <div className="stat-label">Archived Items</div>
          </div>
          <div className="stat-item">
            <ShoppingCart size={20} className="stat-icon" stroke="var(--brass)" />
            <div className="stat-val">{cartCount}</div>
            <div className="stat-label">Items in Cart</div>
          </div>
        </div>
      </div>

      <DraftsSection
        id="profile-drafts"
        onOpenDraft={onOpenDraft}
        onChange={() => setDraftCount(getAllDraftIds().length)}
      />
      <ArchiveSection id="profile-archive" />
      <AboutSection id="profile-about" />
      <ContactSection id="profile-contact" />
    </div>
  )
}
