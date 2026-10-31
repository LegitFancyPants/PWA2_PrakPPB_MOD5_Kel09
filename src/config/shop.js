// ---------------------------------------------------------------------------
// Shop configuration — WhatsApp number used by the cart checkout.
// Can be overridden with VITE_WHATSAPP_NUMBER in .env.
// ---------------------------------------------------------------------------

const RAW_WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '082224096174'

/**
 * Convert a local Indonesian number (08xx) into the international format
 * wa.me expects (628xx), stripping spaces, dashes and a leading "+".
 */
export const toWhatsAppNumber = (number) => {
  const digits = String(number).replace(/\D/g, '')
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  return digits
}

export const WHATSAPP_NUMBER = toWhatsAppNumber(RAW_WHATSAPP_NUMBER)
export const WHATSAPP_DISPLAY = RAW_WHATSAPP_NUMBER
