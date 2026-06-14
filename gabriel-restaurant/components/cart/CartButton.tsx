'use client'

import { ShoppingCart } from 'lucide-react'
import { useCart } from './CartProvider'

export function CartButton({ onClick }: { onClick: () => void }) {
  const { totalItems } = useCart()

  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer"
    >
      <ShoppingCart size={20} />
      <span className="hidden sm:inline">Cart</span>
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-700 text-xs font-bold text-white">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  )
}
