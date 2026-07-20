import { createAdminClient } from '@/lib/supabase/admin'
import AdminTaxonomyTree from '@/components/admin/AdminTaxonomyTree'

export default async function AdminTaxonomyPage() {
  const supabase = createAdminClient()
  const { data: nodes } = await supabase.from('taxonomy_nodes').select('*').order('sort_order')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Taxonomi</h1>
        <p className="text-sm text-gray-500 mt-1">
          Hierarkin bakom projektens Tag-guide — vilken del av byggnaden, ner till konkreta taggar.
          Ändringar gäller direkt för alla företag. Att döpa om eller ta bort en kategori påverkar
          inte taggar som redan satts på projekt eller lärdomar.
        </p>
      </div>
      <AdminTaxonomyTree initialNodes={nodes ?? []} />
    </div>
  )
}
