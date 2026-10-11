import { useTranslation } from 'react-i18next'
import type { SupportedLanguage } from '../i18n'

const LANGUAGES: { code: SupportedLanguage; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'EN' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हि' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰ' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const currentLang = i18n.language as SupportedLanguage

  const handleChange = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('aethera_lang', lang)
  }

  return (
    <div className="lang-switcher" aria-label="Language selector" role="navigation">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          className={`lang-btn${currentLang === lang.code ? ' lang-btn-active' : ''}`}
          onClick={() => handleChange(lang.code)}
          aria-label={`Switch to ${lang.label}`}
          aria-pressed={currentLang === lang.code}
          title={lang.label}
        >
          {lang.nativeLabel}
        </button>
      ))}
    </div>
  )
}
