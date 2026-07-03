import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NewProjectForm from '@/components/NewProjectForm'

// Only clients own a company and can create projects — entrepreneurs and
// spectators only ever join projects they're invited to.
export default async function NewProjectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  if (profile?.role !== 'client') redirect('/projects')

  return <NewProjectForm />
}
