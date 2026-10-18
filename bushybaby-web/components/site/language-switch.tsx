"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { getPrefs } from "@/lib/consent";
import { LOCALE_COOKIE, localeMeta, locales, switchLocalePath, type Locale } from "@/lib/i18n";

/**
 * EN | DE pill. Keeps the current page (/de/reserve ⇄ /en/reserve) and query,
 * and stores the choice in a cookie so proxy.ts respects it on the next visit.
 */
export function LanguageSwitch({ lang, label, className, onNavigate }: { lang: Locale; label: string; className?: string; onNavigate?: () => void }) {
  const pathname = usePathname() || `/${lang}`;
  const search = useSearchParams();
  const qs = search?.toString();

  const remember = (l: Locale) => {
    // Visitor switched "remember my language" off in the cookie settings → set nothing.
    if (!getPrefs().language) return onNavigate?.();
    const year = "path=/; max-age=31536000; samesite=lax";
    // Value cookie for proxy.ts (server build) …
    document.cookie = `${LOCALE_COOKIE}=${l}; ${year}`;
    // … plus one presence cookie per language for static hosting: Netlify's _redirects
    // can only test whether a cookie exists (Cookie=bb_lang_de), not its value.
    for (const other of locales) document.cookie = `bb_lang_${other}=; path=/; max-age=0`;
    document.cookie = `bb_lang_${l}=1; ${year}`;
    onNavigate?.();
  };

  return (
    <nav aria-label={label} className={clsx("flex items-center rounded-full border border-white/12 bg-night p-1 font-mono text-xs", className)}>
      {locales.map((l) => {
        const active = l === lang;
        return (
          <Link
            key={l}
            href={`${switchLocalePath(pathname, l)}${qs ? `?${qs}` : ""}`}
            hrefLang={l}
            lang={l}
            aria-current={active ? "true" : undefined}
            aria-label={localeMeta[l].name}
            onClick={() => remember(l)}
            scroll={false}
            className={clsx("flex h-9 min-w-11 items-center justify-center rounded-full px-2.5 tracking-[0.06em] transition-colors", active ? "bg-white/12 text-moon" : "text-mist hover:text-moon")}
          >
            {localeMeta[l].label}
          </Link>
        );
      })}
    </nav>
  );
}
