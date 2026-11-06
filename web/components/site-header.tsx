"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { getContent } from "@/lib/content"
import { localeNames, locales, lp, ui, type Locale } from "@/lib/i18n"

function LanguageSwitch({ locale, className = "" }: { locale: Locale; className?: string }) {
  const pathname = usePathname() || `/${locale}/`
  const rest = pathname.replace(/^\/(de|en|zh)(?=\/|$)/, "") || "/"
  return (
    <ul aria-label={ui[locale].language} className={`flex items-center gap-1 text-sm font-bold ${className}`}>
      {locales.map((l) => (
        <li key={l}>
          <Link
            href={lp(l, rest)}
            hrefLang={localeNames[l].htmlLang}
            lang={localeNames[l].htmlLang}
            aria-current={l === locale ? "true" : undefined}
            title={localeNames[l].long}
            className={`rounded border-2 px-2 py-1 ${l === locale ? "border-ink bg-ink text-paper" : "border-transparent hover:border-ink"}`}
          >
            {localeNames[l].short}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function SiteHeader({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false)
  const { nav, site } = getContent(locale)
  const t = ui[locale]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={lp(locale, "/")} className="shrink-0 font-display text-2xl font-extrabold tracking-tight" onClick={() => setOpen(false)}>
          Fischer<span className="text-pop-red">-</span>Art
        </Link>

        <nav aria-label={t.mainNav} className="hidden xl:block">
          <ul className="flex items-center gap-0.5 text-sm font-semibold">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={lp(locale, item.href)} className="rounded px-2.5 py-2 hover:bg-pop-yellow focus-visible:bg-pop-yellow">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitch locale={locale} className="hidden sm:flex" />
          <a
            href={site.shopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pop-shadow-sm hidden rounded border-2 border-ink bg-pop-red px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 xl:inline-block"
          >
            {t.shop}
          </a>
          <button
            type="button"
            className="rounded border-2 border-ink px-3 py-1.5 text-sm font-bold xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? t.close : t.menu}
          </button>
        </div>
      </div>

      {open ? (
        <nav id="mobile-nav" aria-label={t.mobileNav} className="border-t-2 border-ink bg-paper xl:hidden">
          <ul className="mx-auto grid max-w-7xl gap-1 px-4 py-4 text-lg font-semibold">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={lp(locale, item.href)} className="block rounded px-3 py-2 hover:bg-pop-yellow" onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <a href={site.shopUrl} target="_blank" rel="noopener noreferrer" className="block rounded px-3 py-2 text-pop-red">
                {t.shop} ↗
              </a>
            </li>
            <li className="px-3 pt-3 sm:hidden">
              <LanguageSwitch locale={locale} />
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  )
}
