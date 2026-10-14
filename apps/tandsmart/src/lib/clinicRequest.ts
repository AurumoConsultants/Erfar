// Shared by server and browser code — keep free of Node-only imports.
export const CLINIC_LINK_DAYS = 30

export const REQUESTABLE_ITEMS = [
  { value: 'journal', label: 'Journalanteckningar' },
  { value: 'rontgen', label: 'Röntgenbilder' },
  { value: 'vardplan', label: 'Vårdplan / kostnadsförslag' },
  { value: 'foto', label: 'Kliniska foton' },
] as const

export type RequestableItem = typeof REQUESTABLE_ITEMS[number]['value']

export function itemLabels(items: string[]) {
  return items.map(i => REQUESTABLE_ITEMS.find(r => r.value === i)?.label ?? i)
}

// Swedish personnummer: accepts YYMMDD-NNNN, YYYYMMDDNNNN and variants;
// returns YYYYMMDD-NNNN when the Luhn check digit is valid, else null.
export function normalizePersonnummer(input: string, now = new Date()): string | null {
  const plus = input.includes('+')
  const digits = input.replace(/\D/g, '')
  let full: string
  if (digits.length === 12) {
    full = digits
  } else if (digits.length === 10) {
    const yy = Number(digits.slice(0, 2))
    const thisYear = now.getFullYear()
    let century = Math.floor(thisYear / 100) * 100
    if (century + yy > thisYear) century -= 100
    if (plus) century -= 100 // "+" marks someone 100 or older
    full = `${century + yy}${digits.slice(2)}`
  } else {
    return null
  }
  const luhnPart = full.slice(2)
  let sum = 0
  for (let i = 0; i < luhnPart.length; i++) {
    let d = Number(luhnPart[i]) * (i % 2 === 0 ? 2 : 1)
    if (d > 9) d -= 9
    sum += d
  }
  if (sum % 10 !== 0) return null
  const month = Number(full.slice(4, 6))
  const day = Number(full.slice(6, 8))
  // Samordningsnummer add 60 to the day.
  if (month < 1 || month > 12 || day < 1 || (day > 31 && day < 61) || day > 91) return null
  return `${full.slice(0, 8)}-${full.slice(8)}`
}

// As-you-type formatting: inserts the dash before the last four digits.
// A value starting with 19/20 is read as ÅÅÅÅMMDD-XXXX, anything else as
// ÅÅMMDD-XXXX; a typed "+" (100 years or older) is kept as the separator.
export function formatPersonnummerInput(value: string): string {
  const plus = value.includes('+')
  const raw = value.replace(/\D/g, '')
  const long = !plus && /^(19|20)/.test(raw)
  const digits = raw.slice(0, long ? 12 : 10)
  const split = long ? 8 : 6
  return digits.length > split ? `${digits.slice(0, split)}${plus ? '+' : '-'}${digits.slice(split)}` : digits
}

export function buildConsentText(o: {
  patientName: string
  personnummer: string
  clinicName: string
  items: string[]
  period?: string | null
}) {
  const what = itemLabels(o.items).join(', ').toLowerCase()
  const period = o.period?.trim() ? ` för perioden ${o.period.trim()}` : ''
  return `Jag, ${o.patientName} (${o.personnummer}), samtycker till att ${o.clinicName} lämnar ut kopior av ${what}${period} `
    + `till Tandsmart, där en legitimerad tandläkare gör en second opinion på min tandvård. `
    + `Samtycket gäller i ${CLINIC_LINK_DAYS} dagar och jag kan återkalla det när som helst i Tandsmart.`
}
