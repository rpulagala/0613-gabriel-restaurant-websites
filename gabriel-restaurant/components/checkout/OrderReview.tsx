'use client'

import { useCart } from '@/components/cart/CartProvider'
import { calculateTax, calculateTotal } from '@/lib/tax'

export function OrderReview() {
  const { items, subtotal } = useCart()
  const tax = calculateTax(subtotal)
  const total = calculateTotal(subtotal, tax)

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <h3 className="mb-3 font-semibold text-gray-900">Order Summary</h3>
      <div className="divide-y divide-gray-200">
        {items.map((item) => (
          <div key={item.menuItemId} className="flex justify-between py-2 text-sm">
            <span className="text-gray-700">
              {item.name} × {item.quantity}
            </span>
            <span className="font-medium text-gray-900">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-1 border-t pt-3">
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
      </div>
    </div>
  )
}
