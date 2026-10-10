// Imports TLV's yearly referensprislista (xlsx, from
// https://www.tlv.se/tandvard/referenspriser.html) into reference_prices.
//
// Usage: node --env-file=.env.local scripts/import-referenspriser.mjs <fil.xlsx> [år]
//
// Columns are found by header text, so small layout changes between years
// don't break it: a column containing "åtgärd" + "nummer"/"kod" for the code,
// "åtgärd" + "namn"/"text" for the description, and "allmän"/"specialist" for
// the two price columns. Check the printed preview before trusting the data.
import { createClient } from '@supabase/supabase-js'
import XLSX from 'xlsx'

const [, , file, yearArg] = process.argv
if (!file) {
  console.error('Usage: node --env-file=.env.local scripts/import-referenspriser.mjs <fil.xlsx> [år]')
  process.exit(1)
}
const year = Number(yearArg) || new Date().getFullYear()

const workbook = XLSX.readFile(file)
const sheet = workbook.Sheets[workbook.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true })

const headerIndex = rows.findIndex(r => r.some(c => /åtgärd/i.test(String(c ?? ''))))
if (headerIndex < 0) {
  console.error('Hittade ingen rubrikrad med "Åtgärd".')
  process.exit(1)
}
const header = rows[headerIndex].map(c => String(c ?? '').toLowerCase())
const col = test => header.findIndex(test)
const codeCol = col(h => h.includes('åtgärd') && /(nummer|nr|kod)/.test(h))
const descCol = col(h => /(namn|text|benämning)/.test(h))
const generalCol = col(h => h.includes('allmän'))
const specialistCol = col(h => h.includes('specialist'))
if ([codeCol, descCol, generalCol].some(i => i < 0)) {
  console.error('Kunde inte hitta kolumnerna. Rubriker:', header)
  process.exit(1)
}

const toPrice = v => {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}

const records = rows.slice(headerIndex + 1)
  .map(r => ({
    code: String(r[codeCol] ?? '').trim(),
    description: String(r[descCol] ?? '').trim(),
    price_general: toPrice(r[generalCol]),
    price_specialist: specialistCol >= 0 ? toPrice(r[specialistCol]) : null,
    valid_year: year,
    updated_at: new Date().toISOString(),
  }))
  .filter(r => /^\d{3}[A-Za-z]?$/.test(r.code) && r.description)

console.log(`Läste ${records.length} åtgärder. Exempel:`)
console.table(records.slice(0, 5))

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const { error } = await supabase.from('reference_prices').upsert(records)
if (error) {
  console.error(`Import misslyckades: ${error.message}`)
  process.exit(1)
}
console.log(`Importerade ${records.length} referenspriser för ${year}.`)
