import { Resend } from 'resend'

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3040'

// Notification emails deliberately carry no health details — only a link
// back to the logged-in app, where the case content lives.
export async function sendNotification(to: string | undefined | null, subject: string, text: string, path: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !to) return { sent: false }
  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'Tandsmart <onboarding@resend.dev>',
    to,
    subject,
    text: `${text}\n\n${appUrl()}${path}\n\n— Tandsmart`,
  })
  return { sent: !error }
}

export function reviewerEmail() {
  return process.env.TANDSMART_REVIEWER_EMAIL
}
