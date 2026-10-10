'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { fieldInputClassName } from '@/components/ui/Field'
import type { CaseMessageRow } from '@/lib/caseData'

interface Props {
  caseId: string
  viewerId: string
  messages: CaseMessageRow[]
}

export default function CaseMessages({ caseId, viewerId, messages }: Props) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setSending(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.from('case_messages').insert({ case_id: caseId, author_id: viewerId, body: body.trim() })
    setSending(false)
    if (error) return setError('Meddelandet kunde inte skickas.')
    setBody('')
    await fetch(`/api/arenden/${caseId}/meddelande`, { method: 'POST' }).catch(() => {})
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {messages.map(m => (
        <div key={m.id} className={`rounded-lg p-3 text-sm ${m.author_id === viewerId ? 'bg-accent-50 ml-8' : 'bg-gray-100 mr-8'}`}>
          <p className="text-xs text-gray-500 mb-1">
            {m.author?.role === 'tandlakare' ? `${m.author.full_name}, leg. tandläkare` : m.author?.full_name}
            {' · '}{new Date(m.created_at).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
          <p className="whitespace-pre-wrap">{m.body}</p>
        </div>
      ))}
      {messages.length === 0 && <p className="text-sm text-gray-500">Inga meddelanden ännu.</p>}
      <form onSubmit={send} className="space-y-2">
        <textarea rows={3} value={body} onChange={e => setBody(e.target.value)} maxLength={5000}
          placeholder="Skriv ett meddelande…" aria-label="Meddelande" className={fieldInputClassName()} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" variant="secondary" disabled={sending || !body.trim()}>{sending ? 'Skickar…' : 'Skicka'}</Button>
        </div>
      </form>
    </div>
  )
}
