'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { clsx } from 'clsx'
import { ClipboardList, CheckCircle, LogOut } from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'Active Orders', icon: ClipboardList },
  { href: '/dashboard/completed', label: 'Completed', icon: CheckCircle },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <>
      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <nav className="hidden sm:flex h-full w-56 shrink-0 flex-col border-r bg-gray-50 p-4">
        <p className="mb-6 text-sm font-bold uppercase tracking-wider text-gray-500">
          {process.env.NEXT_PUBLIC_RESTAURANT_NAME ?? 'Restaurant'}
        </p>
        <div className="flex flex-col gap-1 flex-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-red-700 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/dashboard/login' })}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 cursor-pointer"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </nav>

      {/* ── Mobile bottom nav (hidden on desktop) ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t border-gray-200 bg-white">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
              pathname === href
                ? 'text-red-700'
                : 'text-gray-500'
            )}
          >
            <Icon size={22} />
            {label}
          </Link>
        ))}
        <button
          onClick={() => signOut({ callbackUrl: '/dashboard/login' })}
          className="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium text-gray-500 cursor-pointer"
        >
          <LogOut size={22} />
          Sign Out
        </button>
      </nav>
    </>
  )
}
