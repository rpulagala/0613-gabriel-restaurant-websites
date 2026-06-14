import { Suspense } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Spinner } from '@/components/ui/Spinner'
import { OrderSuccessContent } from './OrderSuccessContent'

export default function OrderSuccessPage() {
  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Suspense fallback={<Spinner />}>
          <OrderSuccessContent />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
