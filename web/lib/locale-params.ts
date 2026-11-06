import { notFound } from "next/navigation"
import { isLocale, type Locale } from "@/lib/i18n"

export type LocaleParams = { params: Promise<{ locale: string }> }

export async function getLocale(params: LocaleParams["params"]): Promise<Locale> {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return locale
}

/** hreflang alternates for a path without locale, e.g. "/person". */
export function alternates(locale: Locale, path: string) {
  const p = path.replace(/^\/+|\/+$/g, "")
  const at = (l: string) => (p ? `/${l}/${p}/` : `/${l}/`)
  return { canonical: at(locale), languages: { de: at("de"), en: at("en"), "zh-Hans": at("zh"), "x-default": at("de") } }
}
