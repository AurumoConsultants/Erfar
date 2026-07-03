import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminOverviewPage() {
  const supabase = createAdminClient()

  const [{ count: companiesCount }, { count: usersCount }, { count: projectsCount }, { count: lessonsCount }] =
    await Promise.all([
      supabase.from('companies').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('lessons').select('*', { count: 'exact', head: true }),
    ])

  const cards = [
    { label: 'Företag', count: companiesCount ?? 0, href: '/admin/companies' },
    { label: 'Användare', count: usersCount ?? 0, href: '/admin/users' },
    { label: 'Projekt', count: projectsCount ?? 0, href: '/admin/projects' },
    { label: 'Lärdomar', count: lessonsCount ?? 0, href: '/admin/lessons' },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Översikt</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <Link key={c.href} href={c.href}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 transition">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="text-3xl font-bold mt-1">{c.count}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
