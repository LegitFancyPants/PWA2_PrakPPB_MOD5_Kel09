import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import { useCart } from '../../hooks/useCart'

/**
 * Add a product to the shopping cart, with a short "Added" confirmation.
 *
 * @param {Object}  props
 * @param {Object}  props.gun
 * @param {boolean} [props.compact] — small button for product cards
 */
export default function AddToCartButton({ gun, compact = false }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const handleClick = (e) => {
    e.stopPropagation()
    addItem(gun)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <button
      type="button"
      className={compact ? 'btn btn--outline btn--sm cart-add-btn' : 'btn btn--primary'}
      onClick={handleClick}
      aria-label={`Add ${gun.name} to cart`}
    >
      {added ? <Check size={compact ? 14 : 16} /> : <ShoppingCart size={compact ? 14 : 16} />}
      {added ? 'Added' : 'Add to Cart'}
    </button>
  )
}
