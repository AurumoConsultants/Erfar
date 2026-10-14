import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { BANKID_COOKIE } from '@/lib/bankid'

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  ;(await cookies()).delete(BANKID_COOKIE)
  return NextResponse.redirect(new URL('/', request.url), { status: 303 })
}
