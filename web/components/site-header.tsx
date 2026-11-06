"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { getContent } from "@/lib/content"
import { getWorks } from "@/lib/works"
import { localeNames, locales, lp, ui, type Locale } from "@/lib/i18n"
import { Magnetic, ScrollProgress } from "@/components/motion"

function LanguageSwitch({ locale, className = "" }: { locale: Locale; className?: string }) {
  const pathname = usePathname() || `/${locale}/`
  const rest = pathname.replace(/^\/(de|en|zh)(?=\/|$)/, "") || "/"
  return (
    <ul aria-label={ui[locale].language} className={`flex items-center rounded-full p-0.5 font-mono text-[0.68rem] tracking-widest ${className}`}>
      {locales.map((l) => (
        <li key={l}>
          <Link
            href={lp(l, rest)}
            hrefLang={localeNames[l].htmlLang}
            lang={localeNames[l].htmlLang}
            aria-current={l === locale ? "true" : undefined}
            title={localeNames[l].long}
            className={`block rounded-full px-2.5 py-1.5 transition-colors duration-300 ${l === locale ? "bg-white/12 text-text" : "text-muted hover:text-text"}`}
          >
            {localeNames[l].short}
          </Link>
        </li>
      ))}
    </ul>
  )
}

type Panel = "work" | "artist" | null

export function SiteHeader({ locale }: { locale: Locale }) {
  const { nav } = getContent(locale)
  const works = getWorks(locale)
  const t = ui[locale]
  const label = (href: string) => nav.find((n) => n.href === href)?.label ?? href
  const [panel, setPanel] = useState<Panel>(null)
  const [mobile, setMobile] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const closeTimer = useRef<number>(0)
  const pathname = usePathname()

  useEffect(() => {
    setPanel(null)
    setMobile(false)
  }, [pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPanel(null)
        setMobile(false)
      }
    }
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("keydown", onKey)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("scroll", onScroll)
    }
  }, [])

  useEffect(() => {
    document.documentElement.style.overflow = mobile ? "hidden" : ""
    const lenis = (window as unknown as { __lenis?: { stop(): void; start(): void } }).__lenis
    if (mobile) lenis?.stop()
    else lenis?.start()
  }, [mobile])

  const open = (p: Panel) => {
    window.clearTimeout(closeTimer.current)
    setPanel(p)
  }
  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setPanel(null), 160)
  }

  const artistLinks = ["/person", "/vita", "/ausstellungen", "/publikationen"]
  const navLink = "relative rounded-full px-4 py-2 text-[0.82rem] font-medium tracking-wide text-muted transition-colors duration-300 hover:text-text"

  return (
    <>
      <ScrollProgress />
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4" onMouseLeave={scheduleClose}>
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full py-2 pl-5 pr-2 transition-all duration-700 ease-[var(--nc-ease-out)] ${
            scrolled || panel ? "border border-line bg-[rgb(10_10_16/0.72)] shadow-[var(--nc-shadow-float)] backdrop-blur-xl" : "border border-transparent"
          }`}
        >
          <Link href={lp(locale, "/")} className="group flex items-baseline gap-2" aria-label="Fischer-Art">
            <span className="font-display text-[1.45rem] font-semibold italic leading-none tracking-tight text-text">Fischer</span>
            <span className="text-metal font-display text-[1.45rem] font-semibold italic leading-none">Art</span>
          </Link>

          <nav aria-label={t.mainNav} className="hidden lg:block">
            <ul className="flex items-center">
              <li onMouseEnter={() => open("work")}>
                <button type="button" aria-expanded={panel === "work"} aria-controls="mega-work" className={navLink} onClick={() => setPanel(panel === "work" ? null : "work")}>
                  {t.menuWork}
                  <span aria-hidden="true" className={`ml-1.5 inline-block transition-transform duration-300 ${panel === "work" ? "rotate-180" : ""}`}>
                    ⌄
                  </span>
                </button>
              </li>
              <li onMouseEnter={() => open("artist")}>
                <button type="button" aria-expanded={panel === "artist"} aria-controls="mega-artist" className={navLink} onClick={() => setPanel(panel === "artist" ? null : "artist")}>
                  {t.footer.artist}
                  <span aria-hidden="true" className={`ml-1.5 inline-block transition-transform duration-300 ${panel === "artist" ? "rotate-180" : ""}`}>
                    ⌄
                  </span>
                </button>
              </li>
              {["/kunst-am-bau", "/#leistungen", "/aktuelles"].map((h) => (
                <li key={h} onMouseEnter={() => open(null)}>
                  <Link href={lp(locale, h)} className={navLink}>
                    {label(h)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitch locale={locale} className="hidden glass-soft sm:flex" />
            <span className="hidden lg:block">
            <Magnetic>
              <Link
                href={lp(locale, "/#kontakt")}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-text px-5 py-2.5 text-[0.82rem] font-semibold text-bg transition-shadow duration-500 hover:shadow-[var(--nc-shadow-glow)]"
              >
                <span className="absolute inset-0 translate-y-full bg-[image:var(--nc-gradient-aurora)] transition-transform duration-500 ease-[var(--nc-ease-out)] group-hover:translate-y-0" />
                <span className="relative">{t.contact}</span>
                <span className="relative transition-transform duration-500 group-hover:translate-x-0.5">→</span>
              </Link>
            </Magnetic>
            </span>
            <button
              type="button"
              className="glass-soft flex h-11 w-11 items-center justify-center rounded-full lg:hidden"
              aria-expanded={mobile}
              aria-controls="mobile-nav"
              aria-label={mobile ? t.close : t.menu}
              onClick={() => setMobile((v) => !v)}
            >
              <span className="relative block h-3 w-5">
                <span className={`absolute left-0 h-px w-5 bg-text transition-all duration-500 ${mobile ? "top-1.5 rotate-45" : "top-0"}`} />
                <span className={`absolute left-0 h-px w-5 bg-text transition-all duration-500 ${mobile ? "top-1.5 -rotate-45" : "top-3"}`} />
              </span>
            </button>
          </div>
        </div>

        {/* Mega-Menü: Werk */}
        <div
          id="mega-work"
          onMouseEnter={() => open("work")}
          className={`mx-auto mt-3 hidden border border-line bg-[rgb(12_12_19/0.96)] shadow-[var(--nc-shadow-float)] backdrop-blur-2xl max-w-7xl origin-top overflow-hidden rounded-[var(--nc-radius-l)] transition-all duration-500 ease-[var(--nc-ease-out)] lg:block ${
            panel === "work" ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-2 scale-[0.98] opacity-0"
          }`}
          inert={panel !== "work"}
        >
          <div className="grid grid-cols-[1fr_2.6fr] gap-8 p-8">
            <div className="flex flex-col justify-between">
              <div>
                <p className="kicker">{t.allWorks}</p>
                <p className="mt-4 font-display text-3xl italic leading-tight">{t.worksLead}</p>
              </div>
              <Link href={lp(locale, "/#werk")} className="mt-6 text-sm text-gold hover:underline">
                {t.explore} →
              </Link>
            </div>
            <ul className="grid grid-cols-3 gap-3">
              {works.map((w, i) => (
                <li key={w.slug}>
                  <Link
                    href={lp(locale, w.slug === "kunst-am-bau" ? "/kunst-am-bau" : `/werk/${w.slug}`)}
                    className="group relative flex h-24 items-end overflow-hidden rounded-[var(--nc-radius-m)] border border-line p-3"
                  >
                    {w.cover ? (
                      <Image src={w.cover.src} alt="" fill sizes="240px" className="object-cover opacity-45 transition duration-700 ease-[var(--nc-ease-out)] group-hover:scale-110 group-hover:opacity-80" />
                    ) : null}
                    <span className="absolute inset-0 bg-gradient-to-t from-bg/90 to-transparent" />
                    <span className="relative flex w-full items-baseline justify-between">
                      <span className="text-sm font-semibold">{w.title}</span>
                      <span className="font-mono text-[0.6rem] text-muted">{String(i + 1).padStart(2, "0")}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Mega-Menü: Künstler */}
        <div
          id="mega-artist"
          onMouseEnter={() => open("artist")}
          className={`mx-auto mt-3 hidden border border-line bg-[rgb(12_12_19/0.96)] shadow-[var(--nc-shadow-float)] backdrop-blur-2xl max-w-3xl origin-top overflow-hidden rounded-[var(--nc-radius-l)] transition-all duration-500 ease-[var(--nc-ease-out)] lg:block ${
            panel === "artist" ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-2 scale-[0.98] opacity-0"
          }`}
          inert={panel !== "artist"}
        >
          <div className="grid grid-cols-[1.1fr_1fr] gap-6 p-6">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--nc-radius-m)]">
              <Image src="/images/person/kontaktbild.webp" alt="" fill sizes="360px" className="object-cover" />
              <span className="absolute inset-0 bg-gradient-to-t from-bg/80 to-transparent" />
              <span className="absolute bottom-3 left-4 font-display text-xl italic">Michael Fischer-Art</span>
            </div>
            <ul className="flex flex-col justify-center">
              {artistLinks.map((h, i) => (
                <li key={h}>
                  <Link href={lp(locale, h)} className="group flex items-baseline gap-4 border-b border-line py-3 text-lg transition-colors hover:text-gold">
                    <span className="font-mono text-[0.65rem] text-dim">{String(i + 1).padStart(2, "0")}</span>
                    <span className="transition-transform duration-500 group-hover:translate-x-1">{label(h)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      {/* Mobile: Vollbild-Menü */}
      <div
        id="mobile-nav"
        className={`fixed inset-0 z-40 bg-bg/96 backdrop-blur-xl transition-opacity duration-500 lg:hidden ${mobile ? "opacity-100" : "pointer-events-none opacity-0"}`}
        inert={!mobile}
      >
        <div className="nc-orb left-[-20%] top-[10%] h-72 w-72 bg-primary/40" />
        <div className="nc-orb bottom-[5%] right-[-15%] h-80 w-80 bg-secondary/40" />
        <nav aria-label={t.mobileNav} className="relative flex h-full flex-col justify-between px-6 pb-10 pt-28">
          <ul className="space-y-1">
            {[...nav.filter((n) => n.href !== "/#kontakt"), { href: "/#kontakt", label: t.contact }].map((item, i) => (
              <li key={item.href} style={{ transitionDelay: mobile ? `${80 + i * 45}ms` : "0ms" }} className={`transition-all duration-700 ease-[var(--nc-ease-out)] ${mobile ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
                <Link href={lp(locale, item.href)} onClick={() => setMobile(false)} className="flex items-baseline gap-4 py-1.5 font-display text-[2.1rem] italic leading-tight">
                  <span className="font-mono text-[0.65rem] not-italic text-dim">{String(i + 1).padStart(2, "0")}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <LanguageSwitch locale={locale} className="glass-soft self-start" />
        </nav>
      </div>
    </>
  )
}
