import type { LessonType, ProjectCategoryType, ProjectCategorySubtype } from '../types'

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

export const SUPPORTED_LOCALES = ['sv'] as const

export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  sv: 'Svenska',
}
