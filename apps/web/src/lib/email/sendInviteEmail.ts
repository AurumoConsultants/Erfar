import { Resend } from 'resend'

const ROLE_LABELS: Record<string, string> = {
  entrepreneur: 'entreprenör',
  spectator_project: 'åskådare (för ett projekt)',
  spectator_company: 'åskådare (för hela företaget)',
}

interface SendInviteEmailParams {
  to: string
  inviterName: string
  companyName: string
  projectName: string | null
  role: string
  inviteUrl: string
}

// Returns { sent: boolean } rather than throwing — a missing/invalid API key
// or a delivery failure should never block invitation creation, since the
// invite link itself (returned to the caller) still works as a fallback.
export async function sendInviteEmail(params: SendInviteEmailParams): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { sent: false, error: 'RESEND_API_KEY är inte konfigurerad.' }
  }

  const { to, inviterName, companyName, projectName, role, inviteUrl } = params
  const roleLabel = ROLE_LABELS[role] ?? role
  const context = projectName ? `projektet "${projectName}"` : `företaget "${companyName}"`
  const from = process.env.RESEND_FROM_EMAIL ?? 'Erfar <onboarding@resend.dev>'

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from,
    to,
    subject: `${inviterName} har bjudit in dig till Erfar`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #1d4ed8;">Erfar</h1>
        <p><strong>${inviterName}</strong> har bjudit in dig som <strong>${roleLabel}</strong> till ${context} på Erfar — en kunskapsbank för lärdomar från byggprojekt.</p>
        <p style="margin: 24px 0;">
          <a href="${inviteUrl}" style="background: #1d4ed8; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Acceptera inbjudan
          </a>
        </p>
        <p style="color: #6b7280; font-size: 13px;">Om knappen inte fungerar, kopiera denna länk: ${inviteUrl}</p>
      </div>
    `,
  })

  if (error) return { sent: false, error: error.message }
  return { sent: true }
}
