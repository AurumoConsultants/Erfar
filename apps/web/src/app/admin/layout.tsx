import { redirect } from 'next/navigation'
import { getAdminProfile } from '@/lib/admin/guard'
import AdminNavbar from '@/components/AdminNavbar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getAdminProfile()
  if (!profile) redirect('/auth/login')

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AdminNavbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {children}
      </main>
    </div>
  )
}
