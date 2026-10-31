import { useEffect, useMemo, useState } from 'react'
import { CartContext } from './cartContext'

// ---------------------------------------------------------------------------
// CartProvider — shopping cart persisted in localStorage so it survives
// reloads and works offline.
//
// Item shape: { id, name, type, caliber, price, image_url, qty }
// ---------------------------------------------------------------------------

const CART_KEY = 'bore_barrel_cart'
const MAX_QTY = 99

const readCart = () => {
  try {
    const raw = localStorage.getItem(CART_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const clampQty = (qty) => Math.max(1, Math.min(MAX_QTY, Math.floor(Number(qty) || 1)))

export default function CartProvider({ children }) {
  const [items, setItems] = useState(readCart)

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items))
    } catch {
      /* quota exceeded — silently fail */
    }
  }, [items])

  const value = useMemo(() => {
    const addItem = (gun, qty = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => String(i.id) === String(gun.id))
        if (existing) {
          return prev.map((i) =>
            i === existing ? { ...i, qty: clampQty(i.qty + qty) } : i,
          )
        }
        return [
          ...prev,
          {
            id: gun.id,
            name: gun.name,
            type: gun.type || gun.category || '',
            caliber: gun.caliber || '',
            price: Number(gun.price ?? gun.cook_time ?? 0),
            image_url: gun.image_url || gun.image || '/guns/pistol.svg',
            qty: clampQty(qty),
          },
        ]
      })
    }

    const updateQty = (id, qty) =>
      setItems((prev) =>
        prev.map((i) => (String(i.id) === String(id) ? { ...i, qty: clampQty(qty) } : i)),
      )

    const removeItem = (id) =>
      setItems((prev) => prev.filter((i) => String(i.id) !== String(id)))

    const clearCart = () => setItems([])

    return {
      items,
      count: items.reduce((sum, i) => sum + i.qty, 0),
      total: items.reduce((sum, i) => sum + Number(i.price) * i.qty, 0),
      addItem,
      updateQty,
      removeItem,
      clearCart,
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
