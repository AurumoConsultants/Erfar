import { getTranslations, type Translations } from '@erfar/shared'

// Only Swedish is supported — multi-locale support was removed.
export async function initLocale() {
  // no-op, kept so root layout's existing init flow keeps working
}

export function t(): Translations {
  return getTranslations('sv')
}
