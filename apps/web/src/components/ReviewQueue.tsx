'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LESSON_TYPES, CONSTRUCTION_PHASES } from '@erfar/shared'
import type { Lesson } from '@erfar/shared'

export default function ReviewQueue({ lessons }: { lessons: Lesson[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [openId, setOpenId] = useState<string | null>(lessons[0]?.id ?? null)
  const [notesById, setNotesById] = useState<Record<string, string>>({})
  const [solutionById, setSolutionById] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function markReviewed(lessonId: string) {
    setSavingId(lessonId)
    setError('')
    const { error: rpcError } = await supabase.rpc('submit_lesson_review', {
      p_lesson_id: lessonId,
      p_review_notes: notesById[lessonId]?.trim() || null,
      p_solution: solutionById[lessonId]?.trim() || null,
    })
    if (rpcError) { setError(rpcError.message); setSavingId(null); return }
    router.refresh()
  }

  if (lessons.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
        Inga lärdomar väntar på genomgång. Bra jobbat — kom tillbaka nästa gång ni loggat något nytt.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {lessons.map(lesson => {
        const typeInfo = LESSON_TYPES.find(t => t.value === lesson.type)!
        const phaseInfo = CONSTRUCTION_PHASES.find(p => p.value === lesson.construction_phase)
        const isOpen = openId === lesson.id
        const isChallenge = lesson.type === 'challenge'

        return (
          <div key={lesson.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : lesson.id)}
              className="w-full flex items-start justify-between gap-3 p-4 text-left hover:bg-gray-50 transition"
            >
              <div className="flex items-start gap-2">
                <span className="text-lg leading-none">{typeInfo.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {lesson.author?.full_name} · {new Date(lesson.created_at).toLocaleDateString('sv-SE')}
                    {phaseInfo && <> · {phaseInfo.label}</>}
                  </p>
                </div>
              </div>
              <span className="text-gray-400 text-sm">{isOpen ? '−' : '+'}</span>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 p-4 space-y-4">
                {lesson.description && <p className="text-sm text-gray-700 whitespace-pre-wrap">{lesson.description}</p>}

                <div>
                  <label className="block text-sm font-medium mb-1">Ytterligare information</label>
                  <textarea
                    value={notesById[lesson.id] ?? ''}
                    onChange={e => setNotesById({ ...notesById, [lesson.id]: e.target.value })}
                    rows={2}
                    placeholder="Vad kom fram vid genomgången som inte stod i den ursprungliga loggningen?"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {isChallenge && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Lösning</label>
                    <textarea
                      value={solutionById[lesson.id] ?? ''}
                      onChange={e => setSolutionById({ ...solutionById, [lesson.id]: e.target.value })}
                      rows={2}
                      placeholder="Hur löstes eller hanterades utmaningen?"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <button
                  type="button"
                  disabled={savingId === lesson.id}
                  onClick={() => markReviewed(lesson.id)}
                  className="bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition"
                >
                  {savingId === lesson.id ? 'Sparar...' : 'Markera som officiell'}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
