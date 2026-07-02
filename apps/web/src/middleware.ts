import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const GATE_COOKIE = 'erfar_gate'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isGateRoute = pathname === '/gate' || pathname.startsWith('/api/gate')

  if (isGateRoute) {
    return NextResponse.next()
  }

  if (request.cookies.get(GATE_COOKIE)?.value !== 'granted') {
    const url = new URL('/gate', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
