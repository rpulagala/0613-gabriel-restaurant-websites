'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CartButton } from '@/components/cart/CartButton'
import { CartDrawer } from '@/components/cart/CartDrawer'

export function Header() {
  const [cartOpen, setCartOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-xl font-bold text-red-700">
            {process.env.NEXT_PUBLIC_RESTAURANT_NAME ?? 'Sizzling Wok'}
          </Link>
          <CartButton onClick={() => setCartOpen(true)} />
        </div>
      </header>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
