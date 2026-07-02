'use client'

import React, { createContext, useContext, type ReactNode } from 'react'
import { getTranslations, type Translations } from '@erfar/shared'

interface I18nContextValue {
  t: Translations
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  return (
    <I18nContext.Provider value={{ t: getTranslations('sv') }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
