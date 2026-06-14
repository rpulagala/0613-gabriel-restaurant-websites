'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Invalid email or password')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white px-4 pt-16 pb-10 sm:items-center sm:justify-center sm:bg-gray-50">
      <div className="w-full sm:max-w-sm sm:rounded-xl sm:bg-white sm:p-8 sm:shadow-lg">
        {/* Branding */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-red-700">
            {process.env.NEXT_PUBLIC_RESTAURANT_NAME ?? 'Sizzling Wok'}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Staff Login</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* text-base prevents iOS auto-zoom on input focus */}
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@restaurant.com"
            className="text-base"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="text-base"
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" loading={loading} className="w-full py-3 text-base">
            Sign In
          </Button>
        </form>
      </div>
    </div>
  )
}
