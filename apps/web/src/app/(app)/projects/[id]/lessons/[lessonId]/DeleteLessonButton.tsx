'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteLessonButton({ lessonId, projectId }: { lessonId: string; projectId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Ta bort denna lärdom?')) return
    setDeleting(true)
    await supabase.from('lessons').delete().eq('id', lessonId)
    router.push(`/projects/${projectId}`)
    router.refresh()
  }

  return (
    <button onClick={handleDelete} disabled={deleting}
      className="text-sm border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition">
      {deleting ? 'Tar bort...' : 'Ta bort'}
    </button>
  )
}
