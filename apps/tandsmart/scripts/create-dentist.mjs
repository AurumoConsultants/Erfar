// Creates (or promotes) the reviewing dentist's account.
//
// Usage: node --env-file=.env.local scripts/create-dentist.mjs <email> <password> [fullName]
import { createClient } from '@supabase/supabase-js'

const [, , email, password, fullName = 'Sylvia'] = process.argv

if (!email || !password) {
  console.error('Usage: node --env-file=.env.local scripts/create-dentist.mjs <email> <password> [fullName]')
  process.exit(1)
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: created, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName, consent_at: new Date().toISOString() },
})

let userId = created?.user?.id
if (error) {
  if (!error.message.includes('already been registered')) {
    console.error(`Failed to create user: ${error.message}`)
    process.exit(1)
  }
  const { data: list } = await supabase.auth.admin.listUsers()
  userId = list.users.find(u => u.email === email)?.id
}

const { error: roleError } = await supabase.from('profiles').update({ role: 'tandlakare', full_name: fullName }).eq('id', userId)
if (roleError) {
  console.error(`Failed to set role: ${roleError.message}`)
  process.exit(1)
}
console.log(`${email} is now the reviewing dentist (tandlakare).`)
