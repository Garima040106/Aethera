
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'

import en from './en.json'
import hi from './hi.json'
import pa from './pa.json'

export type Language = 'en' | 'hi' | 'pa'

const translations = { en, hi, pa }

type TranslationKey = string

type LanguageContextType = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
)

export const languageOptions: {
  value: Language
  label: string
}[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'pa', label: 'ਪੰਜਾਬੀ' },
]

function getTranslation(language: Language, key: string): string {
  const value = key
    .split('.')
    .reduce<unknown>((current, part) => {
      if (current && typeof current === 'object' && part in current) {
        return (current as Record<string, unknown>)[part]
      }
      return undefined
    }, translations[language])

  return typeof value === 'string' ? value : key
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')

  const t = (key: string) => getTranslation(language, key)

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider')
  }

  return context
}
