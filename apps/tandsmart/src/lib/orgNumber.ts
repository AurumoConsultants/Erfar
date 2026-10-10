// Swedish organisationsnummer: NNNNNN-NNNN. Patients type it with or without
// the dash (and sometimes with a 16/19/20 century prefix); store and show it
// in the dashed form.

function digitsOf(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits.length === 12 && /^(16|19|20)/.test(digits) ? digits.slice(2) : digits.slice(0, 10)
}

// As-you-type formatting: inserts the dash once a seventh digit is typed.
export function formatOrgNumberInput(value: string): string {
  const digits = digitsOf(value)
  return digits.length > 6 ? `${digits.slice(0, 6)}-${digits.slice(6)}` : digits
}

// Canonical NNNNNN-NNNN, or null unless the value holds exactly 10 digits.
export function normalizeOrgNumber(value: string | null | undefined): string | null {
  const digits = digitsOf(value ?? '')
  return digits.length === 10 ? `${digits.slice(0, 6)}-${digits.slice(6)}` : null
}
