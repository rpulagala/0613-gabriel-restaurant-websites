'use client'

import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { CartItemType } from '@/types'

type CartAction =
  | { type: 'ADD_ITEM'; item: CartItemType }
  | { type: 'REMOVE_ITEM'; menuItemId: string }
  | { type: 'UPDATE_QUANTITY'; menuItemId: string; quantity: number }
  | { type: 'CLEAR_CART' }

function cartReducer(state: CartItemType[], action: CartAction): CartItemType[] {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.find((i) => i.menuItemId === action.item.menuItemId)
      if (existing) {
        return state.map((i) =>
          i.menuItemId === action.item.menuItemId
            ? { ...i, quantity: i.quantity + action.item.quantity }
            : i
        )
      }
      return [...state, action.item]
    }
    case 'REMOVE_ITEM':
      return state.filter((i) => i.menuItemId !== action.menuItemId)
    case 'UPDATE_QUANTITY':
      if (action.quantity <= 0) return state.filter((i) => i.menuItemId !== action.menuItemId)
      return state.map((i) =>
        i.menuItemId === action.menuItemId ? { ...i, quantity: action.quantity } : i
      )
    case 'CLEAR_CART':
      return []
    default:
      return state
  }
}

interface CartContextValue {
  items: CartItemType[]
  dispatch: React.Dispatch<CartAction>
  totalItems: number
  subtotal: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, [])
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = Math.round(items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100

  return (
    <CartContext.Provider value={{ items, dispatch, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
