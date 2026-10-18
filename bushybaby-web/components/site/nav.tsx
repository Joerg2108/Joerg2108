"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { clsx } from "clsx";
import { Icon, Wordmark } from "./logo";
import { LanguageSwitch } from "./language-switch";
import type { Dictionary } from "@/content/dictionaries";
import { href, type Locale } from "@/lib/i18n";
import { site } from "@/lib/site";
import { whatsappUrl } from "@/lib/whatsapp";

type Props = { lang: Locale; t: Pick<Dictionary, "nav" | "common"> };

export function Nav({ lang, t }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 px-5 pt-4 md:px-[clamp(20px,5vw,80px)]">
      <nav
        aria-label="Main"
        className={clsx(
          "glass mx-auto flex max-w-7xl items-center gap-4 rounded-full pl-5 pr-2.5 transition-[height,background] duration-500 ease-land md:gap-6",
          scrolled ? "h-14 bg-night/92" : "h-[60px]",
        )}
      >
        <Link href={href(lang, "/")} aria-label={`${site.name} ${t.nav.home}`}><Wordmark /></Link>
        <ul className="ml-6 hidden gap-7 text-sm text-mist lg:flex">
          {t.nav.links.map((l) => (
            <li key={l.href}><Link href={href(lang, l.href)} className="transition-colors hover:text-moon">{l.label}</Link></li>
          ))}
        </ul>
        <div className="flex-1" />
        {/* useSearchParams needs a Suspense boundary to keep the pages static */}
        <Suspense fallback={null}>
          <LanguageSwitch lang={lang} label={t.common.language} className="hidden sm:flex" />
        </Suspense>
        <Link href={href(lang, "/reserve")} className="hidden h-11 items-center gap-2 rounded-full bg-moon px-5 text-sm font-semibold text-night transition-transform hover:-translate-y-px sm:flex">
          {t.common.reserve} <Icon.Arrow />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t.nav.open}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="flex size-11 items-center justify-center rounded-full border border-white/15 lg:hidden"
        >
          <Icon.Menu />
        </button>
      </nav>

      {/* Mobile bottom sheet (canvas board 11) */}
      <div className={clsx("fixed inset-0 z-50 lg:hidden", open ? "visible" : "invisible")} aria-hidden={!open}>
        <button type="button" tabIndex={-1} aria-label={t.nav.close} onClick={() => setOpen(false)} className={clsx("absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500", open ? "opacity-100" : "opacity-0")} />
        <div
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label={t.nav.menu}
          className={clsx("absolute inset-x-0 bottom-0 rounded-t-[32px] border-t border-white/15 bg-surface-2/90 px-5 pb-8 pt-3 backdrop-blur-xl transition-transform duration-500 ease-glide", open ? "translate-y-0" : "translate-y-full")}
        >
          <div className="mb-3 flex items-center justify-between">
            <Suspense fallback={null}>
              <LanguageSwitch lang={lang} label={t.common.language} onNavigate={() => setOpen(false)} />
            </Suspense>
            <span aria-hidden className="absolute left-1/2 top-3 h-1 w-10 -translate-x-1/2 rounded-full bg-ghost" />
            <button type="button" onClick={() => setOpen(false)} aria-label={t.nav.close} className="flex size-11 items-center justify-center rounded-full border border-white/15"><Icon.Close /></button>
          </div>
          <ul className="mt-4">
            {t.nav.links.map((l, i) => (
              <li key={l.href} className="border-b border-white/10 last:border-0">
                <Link href={href(lang, l.href)} onClick={() => setOpen(false)} className="flex h-16 items-center justify-between text-[32px] font-semibold tracking-[-0.04em]">
                  {l.label}<span className="font-mono text-xs font-normal text-dim">0{i + 1}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href={href(lang, "/reserve")} onClick={() => setOpen(false)} className="flex h-13 items-center justify-center rounded-full bg-moon font-semibold text-night">{t.common.reserve}</Link>
            <a href={whatsappUrl(site.whatsapp)} className="flex h-13 items-center justify-center gap-2 rounded-full border border-white/20"><Icon.WhatsApp /> {t.common.whatsapp}</a>
          </div>
        </div>
      </div>
    </header>
  );
}
