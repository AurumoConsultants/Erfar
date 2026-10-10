import type { BadgeTone } from '@/components/ui/Badge'

export type CaseService = 'pris' | 'vardplan' | 'klinik'
export type CaseStatus = 'inskickat' | 'under_granskning' | 'komplettering' | 'besvarat' | 'avslutat'
export type CaseVerdict = 'rimligt' | 'delvis_rimligt' | 'ifragasatt'
export type CaseFileKind = 'prisforslag' | 'vardplan' | 'rontgen' | 'journal' | 'foto' | 'ovrigt'
export type ClinicRating = 'ok' | 'observera' | 'varning' | 'okand'

export const SERVICES: { value: CaseService; label: string; description: string }[] = [
  { value: 'pris', label: 'Prisbedömning', description: 'Är priset rimligt jämfört med referenspriser och andra kliniker?' },
  { value: 'vardplan', label: 'Granskning av vårdplan', description: 'Är behandlingen motiverad, finns alternativ, kan den delas upp eller vänta?' },
  { value: 'klinik', label: 'Klinikkoll', description: 'Ekonomisk stabilitet, IVO-ärenden och rykte för kliniken.' },
]

export const SERVICE_LABELS: Record<CaseService, string> = {
  pris: 'Prisbedömning',
  vardplan: 'Vårdplan',
  klinik: 'Klinikkoll',
}

export const STATUS_LABELS: Record<CaseStatus, { label: string; tone: BadgeTone }> = {
  inskickat: { label: 'Inskickat', tone: 'info' },
  under_granskning: { label: 'Under granskning', tone: 'warning' },
  komplettering: { label: 'Väntar på komplettering', tone: 'accent' },
  besvarat: { label: 'Besvarat', tone: 'success' },
  avslutat: { label: 'Avslutat', tone: 'neutral' },
}

export const VERDICT_LABELS: Record<CaseVerdict, { label: string; tone: BadgeTone; text: string }> = {
  rimligt: { label: 'Rimligt', tone: 'success', text: 'Förslaget ser rimligt ut.' },
  delvis_rimligt: { label: 'Delvis rimligt', tone: 'warning', text: 'Delar av förslaget bör diskuteras med kliniken.' },
  ifragasatt: { label: 'Ifrågasatt', tone: 'error', text: 'Förslaget bör ifrågasättas — överväg en second opinion på plats.' },
}

export const FILE_KIND_LABELS: Record<CaseFileKind, string> = {
  prisforslag: 'Prisförslag / kostnadsförslag',
  vardplan: 'Vårdplan / behandlingsförslag',
  rontgen: 'Röntgenbild',
  journal: 'Journalkopia / journaluppgifter',
  foto: 'Foto',
  ovrigt: 'Övrigt',
}

export const CLINIC_RATING_LABELS: Record<ClinicRating, { label: string; tone: BadgeTone }> = {
  ok: { label: 'Inga anmärkningar', tone: 'success' },
  observera: { label: 'Observera', tone: 'warning' },
  varning: { label: 'Varning', tone: 'error' },
  okand: { label: 'Ej bedömt', tone: 'neutral' },
}

export const ACCEPTED_FILE_TYPES = 'application/pdf,image/jpeg,image/png,image/webp,image/heic'
export const MAX_FILE_BYTES = 20 * 1024 * 1024

// Public sources the dentist checks for the clinic review. Org number links
// need the 10 digits without dash.
export function clinicSourceLinks(name: string | null, orgNumber: string | null) {
  const digits = (orgNumber ?? '').replace(/\D/g, '')
  const q = encodeURIComponent(name ?? '')
  const google = (query: string) => `https://www.google.com/search?q=${encodeURIComponent(query)}`
  return [
    digits && { label: 'Allabolag — bokslut & nyckeltal', href: `https://www.allabolag.se/${digits}` },
    { label: 'Bolagsverket — status, konkurs, likvidation', href: 'https://foretagsinfo.bolagsverket.se/' },
    { label: 'IVO — beslut & avgöranden', href: google(`site:ivo.se "${name ?? ''}"`) },
    { label: 'IVO — vårdgivarregistret', href: 'https://vardgivarregistret.ivo.se/' },
    { label: 'Google — omdömen', href: `https://www.google.com/maps/search/${q}` },
    { label: 'Reco — omdömen', href: google(`site:reco.se "${name ?? ''}"`) },
    { label: 'Nyheter', href: `${google(`"${name ?? ''}" tandvård`)}&tbm=nws` },
  ].filter(Boolean) as { label: string; href: string }[]
}
