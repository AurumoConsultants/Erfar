'use client'

// Internal-only feedback widget for testers (Zandra, Claes, Johan). Posts to
// the shared Aurumo CRM feedback pipeline (crm.aurumo.se) using the exact
// same request contract as the sibling Procere/Reditus/Windowa widgets —
// do not change the body shape or header name without updating all four.
import { useState, type FormEvent } from 'react'
import { buttonClassName } from '@/components/ui/Button'
import { fieldInputClassName } from '@/components/ui/Field'

interface FeedbackWidgetProps {
  authorName?: string | null
  authorEmail?: string | null
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export default function FeedbackWidget({ authorName = null, authorEmail = null }: FeedbackWidgetProps) {
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [state, setState] = useState<SubmitState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  function close() {
    setOpen(false)
    setState('idle')
    setErrorMessage('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!comment.trim() || state === 'submitting') return
    setState('submitting')
    setErrorMessage('')

    try {
      const res = await fetch('https://crm.aurumo.se/api/public/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Feedback-Key': process.env.NEXT_PUBLIC_FEEDBACK_API_KEY ?? '',
        },
        body: JSON.stringify({
          product: 'erfar',
          pagePath: window.location.pathname,
          pageTitle: document.title,
          authorName: authorName || null,
          authorEmail: authorEmail || null,
          comment,
        }),
      })

      if (res.status === 201) {
        setState('success')
        setComment('')
        setTimeout(close, 2000)
      } else {
        setState('error')
        setErrorMessage(`Det gick inte att skicka just nu (status ${res.status}).`)
      }
    } catch {
      setState('error')
      setErrorMessage('Det gick inte att nå servern.')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 bg-accent-600 text-white hover:bg-accent-700 rounded-full shadow-lg px-4 py-3 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        aria-label="Lämna feedback"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8-1.06 0-2.077-.163-3.02-.462L3 21l1.55-3.72C3.573 15.892 3 14.5 3 13c0-4.418 4.03-8 9-8s9 3.582 9 7z" />
        </svg>
        Kommentera
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end bg-black/30 p-4 sm:p-6"
          onClick={close}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5"
            role="dialog"
            aria-modal="true"
            aria-label="Lämna feedback"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Skicka feedback</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Stäng"
                className="text-gray-400 hover:text-gray-600 min-w-11 min-h-11 -mr-2 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={4}
                placeholder="Vad fungerar bra? Vad är krångligt?"
                className={fieldInputClassName('resize-none text-sm')}
                autoFocus
                required
              />

              {state === 'success' && (
                <p className="text-xs text-green-600 mt-2" role="status">Tack! Din kommentar är skickad.</p>
              )}
              {state === 'error' && (
                <p className="text-xs text-red-600 mt-2" role="alert">{errorMessage}</p>
              )}

              <div className="flex justify-end gap-2 mt-3">
                <button type="button" onClick={close} className={buttonClassName('secondary')}>
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={state === 'submitting' || !comment.trim()}
                  className={buttonClassName('primary')}
                >
                  {state === 'submitting' ? 'Skickar…' : 'Skicka'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
