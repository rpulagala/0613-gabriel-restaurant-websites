import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl
  const isDashboard = pathname.startsWith('/dashboard')
  const isLogin = pathname === '/dashboard/login'

  if (isDashboard && !isLogin && !isLoggedIn)
    return NextResponse.redirect(new URL('/dashboard/login', req.url))

  if (isLogin && isLoggedIn)
    return NextResponse.redirect(new URL('/dashboard', req.url))
})

export const config = { matcher: ['/dashboard', '/dashboard/((?!login$).+)'] }
