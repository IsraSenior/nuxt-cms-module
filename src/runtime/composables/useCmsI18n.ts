import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import enTranslations from '../locales/en.json'
import esTranslations from '../locales/es.json'

// Available locales
export type CmsLocale = 'en' | 'es'

// Translation type
type TranslationObject = typeof enTranslations
type TranslationKey = string

// Translation map
const translations: Record<CmsLocale, TranslationObject> = {
  en: enTranslations,
  es: esTranslations
}

// Current locale (reactive)
const currentLocale: Ref<CmsLocale> = ref('en')

/**
 * Get value from nested object using dot notation
 * Example: get(obj, 'user.name.first')
 */
function getNested(obj: unknown, path: string): string {
  const keys = path.split('.')
  let current: unknown = obj

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return path // Return the key itself if not found
    }
  }

  return typeof current === 'string' ? current : path
}

/**
 * Replace placeholders in translation strings
 * Example: replacePlaceholders('Hello {name}!', { name: 'John' })
 * Returns: 'Hello John!'
 */
function replacePlaceholders(text: string, params?: Record<string, string | number>): string {
  if (!params) return text

  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key]?.toString() || match
  })
}

/**
 * CMS i18n Composable
 * Provides translation functionality for the admin panel
 */
export function useCmsI18n() {
  /**
   * Get current locale
   */
  const locale = computed(() => currentLocale.value)

  /**
   * Set locale
   */
  function setLocale(newLocale: CmsLocale) {
    if (translations[newLocale]) {
      currentLocale.value = newLocale
      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('cms-locale', newLocale)
      }
    }
  }

  /**
   * Get available locales
   */
  const availableLocales = computed<Array<{ code: CmsLocale; name: string; flag: string }>>(() => [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' }
  ])

  /**
   * Translate a key with optional parameters
   * Example: t('auth.welcome', { name: 'John' })
   */
  function t(key: TranslationKey, params?: Record<string, string | number>): string {
    const translation = getNested(translations[currentLocale.value], key)
    return replacePlaceholders(translation, params)
  }

  /**
   * Check if a translation key exists
   */
  function exists(key: TranslationKey): boolean {
    const result = getNested(translations[currentLocale.value], key)
    return result !== key
  }

  /**
   * Get translation for a specific locale (without changing current locale)
   */
  function tLocale(key: TranslationKey, targetLocale: CmsLocale, params?: Record<string, string | number>): string {
    if (!translations[targetLocale]) return key
    const translation = getNested(translations[targetLocale], key)
    return replacePlaceholders(translation, params)
  }

  /**
   * Initialize locale from user preference, localStorage, or browser
   */
  function init(userLocale?: string | null) {
    if (typeof window === 'undefined') return

    // Priority 1: User preference (from database)
    if (userLocale && translations[userLocale as CmsLocale]) {
      currentLocale.value = userLocale as CmsLocale
      localStorage.setItem('cms-locale', userLocale)
      return
    }

    // Priority 2: localStorage
    const stored = localStorage.getItem('cms-locale') as CmsLocale | null
    if (stored && translations[stored]) {
      currentLocale.value = stored
      return
    }

    // Priority 3: Browser language
    const browserLang = navigator.language.split('-')[0] as CmsLocale
    if (translations[browserLang]) {
      currentLocale.value = browserLang
      return
    }

    // Default to English
    currentLocale.value = 'en'
  }

  // Auto-initialize on mount (without user locale)
  if (typeof window !== 'undefined' && !localStorage.getItem('cms-locale')) {
    init()
  }

  return {
    t,
    locale,
    setLocale,
    availableLocales,
    exists,
    tLocale,
    init
  }
}
