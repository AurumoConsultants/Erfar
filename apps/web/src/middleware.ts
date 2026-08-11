import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  // The PWA manifest must stay reachable regardless of login state — the
  // browser fetches it independently to decide whether "Add to Home
  // Screen" is available, not as part of a normal page navigation.
  const isManifestRoute = pathname === '/manifest.webmanifest'
  // Machine-to-machine routes (Procere's integration) authenticate via
  // their own shared secret, not a browser session.
  const isIntegrationRoute = pathname.startsWith('/api/integrations/')

  if (isManifestRoute || isIntegrationRoute) {
    return NextResponse.next()
  }

  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|mp3)$).*)'],
}
