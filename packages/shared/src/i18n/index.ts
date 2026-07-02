import sv from './sv'
import type { SupportedLocale } from '../constants'

export const translations = { sv }

export type Translations = typeof sv

export function getTranslations(locale: SupportedLocale): Translations {
  return translations[locale] ?? translations.sv
}
