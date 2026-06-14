'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { clsx } from 'clsx'
import { ClipboardList, CheckCircle, LogOut } from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'Active Orders', icon: ClipboardList },
  { href: '/dashboard/completed', label: "Today's Completed", icon: CheckCircle },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="flex h-full w-56 shrink-0 flex-col border-r bg-gray-50 p-4">
      <p className="mb-6 text-sm font-bold uppercase tracking-wider text-gray-500">
        Restaurant
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
  )
}
