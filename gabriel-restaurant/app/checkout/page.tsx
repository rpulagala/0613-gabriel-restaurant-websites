'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/components/cart/CartProvider'
import { CustomerInfoForm } from '@/components/checkout/CustomerInfoForm'
import { OrderReview } from '@/components/checkout/OrderReview'
import { StripePaymentForm } from '@/components/checkout/StripePaymentForm'
import { Header } from '@/components/layout/Header'
import type { CustomerInput } from '@/lib/validations'

type Step = 'info' | 'payment'

interface PaymentData {
  clientSecret: string
  orderId: string
  orderNumber: string
}

export default function CheckoutPage() {
  const { items } = useCart()
  const router = useRouter()
  const [step, setStep] = useState<Step>('info')
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Your cart is empty. <a href="/" className="text-red-700 underline">Browse the menu</a>.</p>
        </main>
      </>
    )
  }

  async function handleCustomerSubmit(customer: CustomerInput) {
    setApiError(null)
    setLoading(true)

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer,
        items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setApiError(data.error ?? 'Something went wrong')
      return
    }

    // TESTING: no clientSecret means payment was bypassed — go straight to confirmation
    if (!data.clientSecret) {
      router.push(`/order-success?orderNumber=${data.orderNumber}`)
      return
    }

    setPaymentData(data)
    setStep('payment')
  }

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Checkout</h1>

        <div className="grid gap-6 md:grid-cols-[1fr_280px]">
          <div>
            {step === 'info' && (
              <>
                {apiError && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{apiError}</p>}
                <CustomerInfoForm onSubmit={handleCustomerSubmit} />
                {loading && <p className="mt-2 text-sm text-gray-500">Creating order…</p>}
              </>
            )}
            {step === 'payment' && paymentData && (
              <StripePaymentForm
                clientSecret={paymentData.clientSecret}
                orderId={paymentData.orderId}
                orderNumber={paymentData.orderNumber}
              />
            )}
          </div>
          <OrderReview />
        </div>
      </main>
    </>
  )
}
