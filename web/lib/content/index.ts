import type { Locale } from "@/lib/i18n"
import * as de from "./de"
import * as en from "./en"
import * as zh from "./zh"

export type Content = typeof de

const all: Record<Locale, Content> = { de, en, zh }

export function getContent(locale: Locale): Content {
  return all[locale]
}
