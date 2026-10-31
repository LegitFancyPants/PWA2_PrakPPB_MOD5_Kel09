// ---------------------------------------------------------------------------
// share.js — unique, shareable product links.
//
// Every product gets a deep link of the form  <origin>/?product=<id>.
// Opening that link boots the app straight into the product detail view.
// ---------------------------------------------------------------------------

const PARAM = 'product'

/**
 * Build the unique share URL for a product.
 */
export const buildShareUrl = (gun) => {
  const url = new URL(window.location.pathname, window.location.origin)
  url.searchParams.set(PARAM, gun.id)
  return url.toString()
}

/**
 * Read the product id from the current URL, or null.
 */
export const getSharedProductId = () => {
  try {
    return new URLSearchParams(window.location.search).get(PARAM)
  } catch {
    return null
  }
}

/**
 * Reflect the open product in the address bar (or clear it with null),
 * without adding a history entry.
 */
export const setProductInUrl = (id) => {
  const url = new URL(window.location.href)
  if (id == null) url.searchParams.delete(PARAM)
  else url.searchParams.set(PARAM, id)
  window.history.replaceState(window.history.state, '', url)
}

const copyText = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  // Legacy fallback for non-secure contexts
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  document.execCommand('copy')
  document.body.removeChild(area)
}

/**
 * Share a product link via the native share sheet when available,
 * otherwise copy it to the clipboard.
 * @returns {Promise<'shared'|'copied'|'cancelled'>}
 */
export const shareProduct = async (gun) => {
  const url = buildShareUrl(gun)

  if (navigator.share) {
    try {
      await navigator.share({
        title: `${gun.name} — Bore & Barrel`,
        text: `Check out ${gun.name} at Bore & Barrel`,
        url,
      })
      return 'shared'
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled'
      // Share sheet unavailable — fall back to copying
    }
  }

  await copyText(url)
  return 'copied'
}
