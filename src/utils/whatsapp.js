// ---------------------------------------------------------------------------
// whatsapp.js — build the cart checkout message and wa.me redirect URL.
// ---------------------------------------------------------------------------

import { WHATSAPP_NUMBER } from '../config/shop'
import { formatPrice } from './helpers'

/**
 * Compose the order draft, e.g.
 *
 *   Hi aku mau pesan:
 *   1. Glock 17 (Pistol · 9mm) x2 = $1,198
 *
 *   Total: $1,198
 */
export const buildOrderMessage = (items, { customerName, note } = {}) => {
  const lines = items.map((item, i) => {
    const spec = [item.type, item.caliber].filter(Boolean).join(' · ')
    const subtotal = formatPrice(Number(item.price) * item.qty)
    return `${i + 1}. ${item.name}${spec ? ` (${spec})` : ''} x${item.qty} = ${subtotal}`
  })
  const total = items.reduce((sum, item) => sum + Number(item.price) * item.qty, 0)

  return [
    'Hi aku mau pesan:',
    ...lines,
    '',
    `Total: ${formatPrice(total)}`,
    customerName ? `Nama: ${customerName}` : null,
    note ? `Catatan: ${note}` : null,
  ]
    .filter((line) => line !== null)
    .join('\n')
}

/**
 * wa.me link that opens WhatsApp with `message` pre-filled.
 */
export const buildWhatsAppUrl = (message, number = WHATSAPP_NUMBER) =>
  `https://wa.me/${number}?text=${encodeURIComponent(message)}`
