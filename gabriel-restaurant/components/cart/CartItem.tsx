'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCart } from './CartProvider'
import type { CartItemType } from '@/types'

export function CartItem({ item }: { item: CartItemType }) {
  const { dispatch } = useCart()

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => dispatch({ type: 'UPDATE_QUANTITY', menuItemId: item.menuItemId, quantity: item.quantity - 1 })}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 cursor-pointer"
        >
          <Minus size={12} />
        </button>
        <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
        <button
          onClick={() => dispatch({ type: 'UPDATE_QUANTITY', menuItemId: item.menuItemId, quantity: item.quantity + 1 })}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 cursor-pointer"
        >
          <Plus size={12} />
        </button>
        <button
          onClick={() => dispatch({ type: 'REMOVE_ITEM', menuItemId: item.menuItemId })}
          className="ml-1 text-red-400 hover:text-red-600 cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <p className="w-16 text-right text-sm font-medium text-gray-900">
        ${(item.price * item.quantity).toFixed(2)}
      </p>
    </div>
  )
}
