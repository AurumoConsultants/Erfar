import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import CompanyEditForm from '@/components/admin/CompanyEditForm'

export default async function AdminCompanyEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: company } = await supabase.from('companies').select('*').eq('id', id).single()
  if (!company) notFound()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Redigera företag</h1>
      <CompanyEditForm company={company} />
    </div>
  )
}
