import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/components/cart/CartProvider'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_RESTAURANT_NAME ?? 'Sizzling Wok',
  description: 'Online food ordering',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white text-gray-900">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  )
}
