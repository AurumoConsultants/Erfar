// Swedish organisationsnummer: 10 digits (NNNNNN-NNNN), validated with the
// standard mod-10 (Luhn) checksum used for Swedish person-/organisationsnummer.
export function isValidSwedishOrgNumber(input: string): boolean {
  const digits = input.replace(/\D/g, '')
  const ten = digits.length === 12 ? digits.slice(2) : digits
  if (!/^\d{10}$/.test(ten)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(ten[i], 10)
    if (i % 2 === 0) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit === parseInt(ten[9], 10)
}

export function normalizeOrgNumber(input: string): string {
  const digits = input.replace(/\D/g, '')
  const ten = digits.length === 12 ? digits.slice(2) : digits
  return ten.length === 10 ? `${ten.slice(0, 6)}-${ten.slice(6)}` : input
}
