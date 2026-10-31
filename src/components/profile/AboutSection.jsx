import { Info } from 'lucide-react'

/**
 * About the shop — shown as a section inside the profile page
 * (previously the standalone About page).
 */
export default function AboutSection({ id }) {
  return (
    <section id={id} className="profile-section">
      <h3 className="section-title">
        <Info size={18} /> About
      </h3>
      <h2 className="display profile-section-display">A one-room armory.</h2>
      <p className="lede">
        Bore &amp; Barrel sells a short, honest list of firearms. Each piece is priced
        from the bench — no markup theatre, no filler.
      </p>
    </section>
  )
}
