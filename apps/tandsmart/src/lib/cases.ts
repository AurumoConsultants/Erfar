import type { BadgeTone } from '@/components/ui/Badge'

export type CaseService = 'pris' | 'vardplan' | 'klinik' | 'omfattande' | 'video'
export type CaseStatus = 'inskickat' | 'under_granskning' | 'komplettering' | 'besvarat' | 'avslutat'
export type CaseVerdict = 'rimligt' | 'delvis_rimligt' | 'ifragasatt'
export type CaseFileKind = 'prisforslag' | 'vardplan' | 'rontgen' | 'journal' | 'foto' | 'ovrigt'
export type ClinicRating = 'ok' | 'observera' | 'varning' | 'okand'

// What the patient orders: one package plus optional add-ons. Each maps to
// the services stored on the case; prices are shown to the patient (SEK, incl. VAT).
export type PackageId = 'prisbedomning' | 'second_opinion' | 'omfattande'

export const PACKAGES: { id: PackageId; label: string; description: string; price: number; services: CaseService[] }[] = [
  { id: 'prisbedomning', label: 'Prisbedömning', price: 495, services: ['pris'],
    description: 'Är priset rimligt jämfört med referenspriserna? Vad driver kostnaden och vad bör du fråga kliniken?' },
  { id: 'second_opinion', label: 'Second opinion', price: 1295, services: ['pris', 'vardplan'],
    description: 'Prisbedömning plus granskning av vårdplanen: är behandlingen motiverad, finns alternativ, kan den delas upp eller vänta?' },
  { id: 'omfattande', label: 'Second opinion omfattande', price: 1995, services: ['pris', 'vardplan', 'omfattande'],
    description: 'För implantat, broar och proteser, fler än 4 tänder eller prisförslag över 40 000 kr.' },
]

export const ADDONS: { service: CaseService; label: string; description: string; price: number }[] = [
  { service: 'klinik', label: 'Klinikkoll', price: 295,
    description: 'Klinikens ekonomiska stabilitet, IVO-ärenden och omdömen.' },
  { service: 'video', label: 'Videosamtal med Doktor Sylvia', price: 795,
    description: '20 minuter där ni går igenom bedömningen tillsammans.' },
]

export function packageOf(services: CaseService[]): PackageId | null {
  if (services.includes('omfattande')) return 'omfattande'
  if (services.includes('vardplan')) return 'second_opinion'
  if (services.includes('pris')) return 'prisbedomning'
  return null
}

// Human summary of what was ordered, e.g. "Second opinion · Klinikkoll".
export function serviceSummary(services: CaseService[]): string {
  const pkg = PACKAGES.find(p => p.id === packageOf(services))
  const addons = ADDONS.filter(a => services.includes(a.service)).map(a => a.label)
  return [pkg?.label, ...addons].filter(Boolean).join(' · ')
}

export const formatPrice = (kr: number) => `${kr.toLocaleString('sv-SE')} kr`

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
