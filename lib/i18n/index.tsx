"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import en from "./en.json"
import vi from "./vi.json"

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE"

export const supportedLocales = ["en", "vi"] as const
export type Locale = (typeof supportedLocales)[number]

type MessageTree = typeof en

const dictionaries: Record<Locale, MessageTree> = {
  en,
  vi,
}

const DEFAULT_LOCALE: Locale = "en"

function normalizeLocale(locale: string | null | undefined): Locale {
  return locale === "vi" ? "vi" : DEFAULT_LOCALE
}

function getPathValue(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return (current as Record<string, unknown>)[segment]
    }
    return undefined
  }, source)
}

function formatMessage(template: string, values?: Record<string, string | number>) {
  if (!values) {
    return template
  }

  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = values[key]
    return value === undefined || value === null ? `{${key}}` : String(value)
  })
}

function translate(dictionary: MessageTree, key: string, values?: Record<string, string | number>) {
  const value = getPathValue(dictionary, key)

  if (typeof value === "string") {
    return formatMessage(value, values)
  }

  return key
}

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, values?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale
  children: React.ReactNode
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  useEffect(() => {
    document.documentElement.lang = locale
    document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; samesite=lax`
  }, [locale])

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale)
  }

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, values) => translate(dictionaries[locale], key, values),
    }),
    [locale]
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)

  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider")
  }

  return context
}

export function useTranslations() {
  return useLocale()
}

export function getLocaleFromCookie(cookieValue?: string | null): Locale {
  return normalizeLocale(cookieValue)
}

export function getDictionary(locale: string | null | undefined) {
  return dictionaries[normalizeLocale(locale)]
}
