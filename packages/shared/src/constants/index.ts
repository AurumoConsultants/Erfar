import type { LessonType, ProjectCategoryType, ProjectCategorySubtype, ProcurementForm, ContractForm, ConstructionPhase, UserRole } from '../types'

export { SWEDISH_KOMMUNER, type SwedishKommun } from './kommuner'

export const ROLE_LABELS: Record<UserRole, string> = {
  client: 'Klient',
  entrepreneur: 'Entreprenör',
  spectator: 'Åskådare',
  konsult: 'Konsult',
}

export const LESSON_TYPES: {
  value: LessonType
  label: string
  icon: string
  color: string
}[] = [
  { value: 'challenge', label: 'Utmaning', icon: '⚠️', color: '#d97706' },
  { value: 'success', label: 'Framgång', icon: '✅', color: '#16a34a' },
]

// Starter suggestions shown in tag autocomplete before a company has built up its own tag history
export const SUGGESTED_TAGS = [
  'tidplan',
  'budget',
  'kommunikation',
  'säkerhet',
  'kvalitet',
  'leverantör',
  'väder',
  'logistik',
  'arbetsmiljö',
  'dokumentation',
] as const

// Preset "byggmoment" options for the lesson-logging wizard's category step.
// Stored as public.tags rows (kind='work_type') — a company can add more,
// which then show up here too via the tags table, same as SUGGESTED_TAGS.
export const WORK_TYPES = [
  'rivning',
  'demontering',
  'montage',
  'renovering',
] as const

// Preset "byggdel" options for the lesson-logging wizard's category step
// (kind='building_part').
export const BUILDING_PARTS = [
  'tak',
  'fasad',
  'fönster',
  'fönsterdörr',
  'balkong',
  'sockel',
  'entréparti',
  'golv',
  'innertak',
  'innervägg',
] as const

// "Var i byggprocessen" — which phase of the construction process the project is in.
export const CONSTRUCTION_PHASES: { value: ConstructionPhase; label: string }[] = [
  { value: 'idea_stage', label: 'Idéstadie' },
  { value: 'early_stages', label: 'Tidiga skeden' },
  { value: 'design', label: 'Projektering' },
  { value: 'execution', label: 'Utförande' },
  { value: 'management', label: 'Förvaltning' },
]

// Some roles only ever log lessons for a subset of construction phases.
// Undefined means all phases are selectable (clients, spectators can't log
// at all so this doesn't apply to them).
export function allowedPhasesForRole(role: UserRole | undefined): ConstructionPhase[] | undefined {
  if (role === 'entrepreneur') return ['execution']
  if (role === 'konsult') return ['idea_stage', 'early_stages', 'design']
  return undefined
}

export const PROJECT_CATEGORY_TYPES: { value: ProjectCategoryType; label: string }[] = [
  { value: 'nybyggnation', label: 'Nybyggnation' },
  { value: 'renovering', label: 'Renovering' },
  { value: 'service', label: 'Service' },
]

// Same four subtypes apply under every category type.
export const PROJECT_CATEGORY_SUBTYPES: { value: ProjectCategorySubtype; label: string }[] = [
  { value: 'bostader', label: 'Bostäder' },
  { value: 'kontor', label: 'Kontor' },
  { value: 'lokaler', label: 'Lokaler' },
  { value: 'ovrigt', label: 'Övrigt' },
]

// "Upphandlingsform" — which standard contract the procurement is run under.
export const PROCUREMENT_FORMS: { value: ProcurementForm; label: string }[] = [
  { value: 'abt06', label: 'ABT 06' },
  { value: 'ab04', label: 'AB 04' },
  { value: 'service', label: 'Serviceprojekt' },
  { value: 'partnering', label: 'Partnering' },
]

// "Entreprenadform" — how the contract work is split between entrepreneurs.
export const CONTRACT_FORMS: { value: ContractForm; label: string }[] = [
  { value: 'totalentreprenad', label: 'Totalentreprenad' },
  { value: 'delad_entreprenad', label: 'Delad entreprenad' },
]

export const SUPPORTED_LOCALES = ['sv'] as const

export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  sv: 'Svenska',
}
