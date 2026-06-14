'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCart } from '@/components/cart/CartProvider'
import { Spinner } from '@/components/ui/Spinner'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

export function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const { dispatch } = useCart()
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const paymentIntentId = searchParams.get('payment_intent')
  const directOrderNumber = searchParams.get('orderNumber')

  useEffect(() => {
    // TESTING: order number passed directly (payment bypassed)
    if (directOrderNumber) {
      dispatch({ type: 'CLEAR_CART' })
      setOrderNumber(directOrderNumber)
      setLoading(false)
      return
    }

    if (!paymentIntentId) {
      setLoading(false)
      return
    }

    dispatch({ type: 'CLEAR_CART' })

    fetch(`/api/orders/success?payment_intent=${paymentIntentId}`)
      .then((r) => r.json())
      .then((d) => setOrderNumber(d.orderNumber ?? null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [paymentIntentId, directOrderNumber, dispatch])

  if (loading) return <Spinner />

  return (
    <div className="text-center space-y-4">
      <CheckCircle className="mx-auto text-green-500" size={56} />
      <h1 className="text-2xl font-bold text-gray-900">Order Placed!</h1>
      {orderNumber && (
        <p className="text-gray-600">
          Your order number is <span className="font-mono font-semibold">{orderNumber}</span>.
        </p>
      )}
      <p className="text-gray-500">A confirmation email is on its way.</p>
      <Link
        href="/"
        className="mt-4 inline-block rounded-lg bg-red-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-red-800"
      >
        Back to Menu
      </Link>
    </div>
  )
}
