'use client'

import { Plus } from 'lucide-react'
import { useCart } from '@/components/cart/CartProvider'
import type { SerializableMenuItem } from '@/types'

export function MenuItemCard({ item }: { item: SerializableMenuItem }) {
  const { dispatch } = useCart()

  function addToCart() {
    dispatch({
      type: 'ADD_ITEM',
      item: {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
      },
    })
  }

  return (
    <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div>
        <h3 className="font-medium text-gray-900">{item.name}</h3>
        {item.description && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{item.description}</p>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-semibold text-gray-900">${item.price.toFixed(2)}</span>
        <button
          onClick={addToCart}
          className="flex items-center gap-1 rounded-lg bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800 transition-colors cursor-pointer"
        >
          <Plus size={14} />
          Add
        </button>
      </div>
    </div>
  )
}
