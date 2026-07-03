// Creates (or promotes) an admin user. Requires NEXT_PUBLIC_SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY (e.g. from .env.local) plus the is_admin column
// to already exist on public.profiles.
//
// Usage: node --env-file=.env.local scripts/create-admin.mjs <email> <password> [fullName]
import { createClient } from '@supabase/supabase-js'

const [, , email, password, fullName] = process.argv

if (!email || !password) {
  console.error('Usage: node --env-file=.env.local scripts/create-admin.mjs <email> <password> [fullName]')
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function main() {
  // If the user already exists (e.g. re-running to promote them), reuse it.
  let userId
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name: fullName || 'Admin' },
    email_confirm: true,
  })

  if (createError) {
    if (!createError.message.includes('already been registered')) {
      console.error(`Failed to create user: ${createError.message}`)
      process.exit(1)
    }
    const { data: list, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) { console.error(listError.message); process.exit(1) }
    const existing = list.users.find(u => u.email === email)
    if (!existing) { console.error('User exists but could not be found via listUsers'); process.exit(1) }
    userId = existing.id
    console.log(`User ${email} already exists (${userId}) — promoting to admin.`)
  } else {
    userId = created.user.id
    console.log(`Created auth user ${email} (${userId}).`)
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      { id: userId, email, full_name: fullName || 'Admin', is_admin: true },
      { onConflict: 'id' }
    )
  if (profileError) {
    console.error(`Failed to upsert profile: ${profileError.message}`)
    process.exit(1)
  }

  console.log(`Done. ${email} is now an admin.`)
}

main()
