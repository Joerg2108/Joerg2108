import type { Metadata } from "next";
import { defaultLocale, href, locales, type Locale } from "./i18n";

/**
 * canonical + hreflang for one page in all languages.
 * Google needs every language version to list ALL versions (incl. itself),
 * plus x-default for visitors whose language we don't support.
 */
export function alternates(lang: Locale, path: string): Metadata["alternates"] {
  return {
    canonical: href(lang, path),
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, href(l, path)])),
      "x-default": href(defaultLocale, path),
    },
  };
}
