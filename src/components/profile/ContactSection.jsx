import { Phone, MessageCircle } from 'lucide-react'
import { WHATSAPP_NUMBER, WHATSAPP_DISPLAY } from '../../config/shop'

/**
 * Contact details — shown as a section inside the profile page
 * (previously the standalone Contact page).
 */
export default function ContactSection({ id }) {
  return (
    <section id={id} className="profile-section">
      <h3 className="section-title">
        <Phone size={18} /> Contact
      </h3>
      <h2 className="display profile-section-display">Come by the shop.</h2>
      <p className="lede">
        123 Range Road. Open Tuesday to Saturday, 10 to 6. Call (555) 010-0100.
      </p>
      <a
        className="btn btn--outline btn--sm profile-section-link"
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle size={14} /> WhatsApp {WHATSAPP_DISPLAY}
      </a>
    </section>
  )
}
