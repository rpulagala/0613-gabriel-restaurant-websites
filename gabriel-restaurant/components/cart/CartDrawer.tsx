'use client'

import { X } from 'lucide-react'
import Link from 'next/link'
import { useCart } from './CartProvider'
import { CartItem } from './CartItem'
import { Button } from '@/components/ui/Button'
import { calculateTax, calculateTotal } from '@/lib/tax'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, subtotal } = useCart()
  const tax = calculateTax(subtotal)
  const total = calculateTotal(subtotal, tax)

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b px-4 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Cart</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 divide-y">
          {items.length === 0 ? (
            <p className="py-8 text-center text-gray-500">Your cart is empty</p>
          ) : (
            items.map((item) => <CartItem key={item.menuItemId} item={item} />)
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t px-4 py-4 space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax (9.5%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <Link href="/checkout" onClick={onClose}>
              <Button className="w-full mt-2">Proceed to Checkout</Button>
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
