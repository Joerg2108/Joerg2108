/**
 * Locale config + pure helpers (no Next.js imports, so they're unit-testable
 * and usable in proxy.ts, server and client code alike).
 */

export const locales = ["en", "de"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/** Cookie set by the language switcher; wins over the browser's Accept-Language. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const localeMeta: Record<Locale, { label: string; name: string; og: string; intl: string }> = {
  en: { label: "EN", name: "English", og: "en_KE", intl: "en-GB" },
  de: { label: "DE", name: "Deutsch", og: "de_DE", intl: "de-DE" },
};

export function hasLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

/**
 * Picks the best supported locale from an Accept-Language header.
 * "de-AT,de;q=0.9,en;q=0.8" → "de". Region variants match their base language.
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return defaultLocale;
  const ranked = acceptLanguage
    .split(",")
    .map((part, i) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { base: tag.toLowerCase().split("-")[0], q: q ? Number(q.slice(2)) || 0 : 1, i };
    })
    .filter((x) => x.base && x.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  return ranked.find((x) => hasLocale(x.base))?.base as Locale ?? defaultLocale;
}

/** Returns the locale prefix of a pathname, if any: "/de/reserve" → "de". */
export function localeFromPath(pathname: string): Locale | null {
  const seg = pathname.split("/")[1];
  return hasLocale(seg) ? seg : null;
}

/** "/en/reserve?x=1" + "de" → "/de/reserve?x=1"; paths without prefix get one. */
export function switchLocalePath(pathname: string, to: Locale): string {
  const current = localeFromPath(pathname);
  if (current) return `/${to}${pathname.slice(current.length + 1)}` || `/${to}`;
  return `/${to}${pathname === "/" ? "" : pathname}`;
}

/** Locale-prefixed internal link: href("de", "/reserve") → "/de/reserve", href("de", "/") → "/de". */
export function href(lang: Locale, path: string): string {
  if (path.startsWith("http")) return path;
  return path === "/" ? `/${lang}` : `/${lang}${path}`;
}
