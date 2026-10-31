import { useMemo, useState } from 'react'
import { ShoppingCart, Minus, Plus, Trash2, MessageCircle, ArrowRight } from 'lucide-react'
import { useCart } from '../hooks/useCart'
import ConfirmModal from '../components/modals/ConfirmModal'
import { getUserProfile } from '../services/userService'
import { buildOrderMessage, buildWhatsAppUrl } from '../utils/whatsapp'
import { formatPrice } from '../utils/helpers'
import { WHATSAPP_DISPLAY } from '../config/shop'

/**
 * CartPage — review cart items, adjust quantities, and check out through
 * WhatsApp with an auto-filled "Hi aku mau pesan …" message.
 */
export default function CartPage({ onNavigateCatalog }) {
  const { items, count, total, updateQty, removeItem, clearCart } = useCart()
  const [note, setNote] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)

  const customerName = useMemo(() => {
    const name = getUserProfile().username
    return name && name !== 'Shooter' ? name : ''
  }, [])

  const message = useMemo(
    () => buildOrderMessage(items, { customerName, note: note.trim() }),
    [items, customerName, note],
  )

  const handleCheckout = () => {
    const url = buildWhatsAppUrl(message)
    const win = window.open(url, '_blank')
    if (win) win.opener = null
    else window.location.href = url // popup blocked — redirect in place
  }

  return (
    <div className="cart-page">
      <section className="masthead">
        <h1 className="display">Shopping Cart</h1>
        <p className="lede">
          Review your order, then check out — we will open WhatsApp with your order ready to send.
        </p>
      </section>

      <section>
        <div className="list-head">
          <h2>Your items</h2>
          <span className="count">
            {count} item{count !== 1 ? 's' : ''}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="state-box">
            <ShoppingCart size={36} stroke="var(--steel)" />
            <h3>Your cart is empty</h3>
            <p className="lede">Add hardware from the catalog to start an order.</p>
            {onNavigateCatalog && (
              <button
                type="button"
                className="btn btn--primary"
                onClick={onNavigateCatalog}
                style={{ marginTop: '16px' }}
              >
                Browse Catalog <ArrowRight size={16} />
              </button>
            )}
          </div>
        ) : (
          <div className="cart-layout">
            <ul className="cart-list">
              {items.map((item) => (
                <li key={item.id} className="cart-item">
                  <img
                    className="cart-item-img"
                    src={item.image_url}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="cart-item-info">
                    <span className="name display">{item.name}</span>
                    <span className="type">
                      {[item.type, item.caliber].filter(Boolean).join(' · ')}
                    </span>
                    <span className="price">{formatPrice(item.price)}</span>
                  </div>
                  <div className="cart-item-controls">
                    <div className="qty-stepper" role="group" aria-label={`Quantity of ${item.name}`}>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        disabled={item.qty <= 1}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span aria-live="polite">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="cart-subtotal">{formatPrice(item.price * item.qty)}</span>
                    <button
                      type="button"
                      className="btn btn--danger-ghost"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <aside className="cart-summary">
              <h3 className="section-title">Order summary</h3>
              <div className="cart-total-row">
                <span>Total</span>
                <strong className="price">{formatPrice(total)}</strong>
              </div>

              <div className="form-group">
                <label htmlFor="cart-note" className="form-label">
                  Order note (optional)
                </label>
                <textarea
                  id="cart-note"
                  className="form-textarea"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. pick up on Saturday"
                  maxLength={200}
                />
              </div>

              <div className="form-group">
                <span className="form-label">WhatsApp message preview</span>
                <pre className="wa-preview">{message}</pre>
              </div>

              <button type="button" className="btn btn--whatsapp" onClick={handleCheckout}>
                <MessageCircle size={18} /> Checkout via WhatsApp
              </button>
              <p className="form-hint">Order is sent to {WHATSAPP_DISPLAY}.</p>

              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => setConfirmClear(true)}
              >
                Clear cart
              </button>
            </aside>
          </div>
        )}
      </section>

      <ConfirmModal
        open={confirmClear}
        title="Clear Cart"
        message="Remove every item from your cart?"
        confirmLabel="Clear"
        danger
        onConfirm={() => {
          clearCart()
          setConfirmClear(false)
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  )
}
