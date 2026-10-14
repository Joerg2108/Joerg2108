"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Icon, Wordmark } from "./logo";
import { site } from "@/lib/site";
import { whatsappUrl } from "@/lib/whatsapp";

export const NAV_LINKS = [
  { href: "/menu", label: "Menu" },
  { href: "/nights", label: "Nights" },
  { href: "/story", label: "Story" },
  { href: "/journal", label: "Journal" },
  { href: "/reserve", label: "Visit" },
];

export function Nav() {
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
          "glass mx-auto flex max-w-7xl items-center gap-6 rounded-full pl-5 pr-2.5 transition-[height,background] duration-500 ease-land",
          scrolled ? "h-14 bg-night/80" : "h-[60px]",
        )}
      >
        <Link href="/" aria-label={`${site.name} home`}><Wordmark /></Link>
        <ul className="ml-6 hidden gap-7 text-sm text-mist md:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.href}><Link href={l.href} className="transition-colors hover:text-moon">{l.label}</Link></li>
          ))}
        </ul>
        <div className="flex-1" />
        <Link href="/reserve" className="hidden h-11 items-center gap-2 rounded-full bg-moon px-5 text-sm font-semibold text-night transition-transform hover:-translate-y-px sm:flex">
          Reserve <Icon.Arrow />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="flex size-11 items-center justify-center rounded-full border border-white/15 md:hidden"
        >
          <Icon.Menu />
        </button>
      </nav>

      {/* Mobile bottom sheet (canvas board 11) */}
      <div className={clsx("fixed inset-0 z-50 md:hidden", open ? "visible" : "invisible")} aria-hidden={!open}>
        <button type="button" tabIndex={-1} aria-label="Close menu" onClick={() => setOpen(false)} className={clsx("absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500", open ? "opacity-100" : "opacity-0")} />
        <div
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={clsx("absolute inset-x-0 bottom-0 rounded-t-[32px] border-t border-white/15 bg-surface-2/90 px-5 pb-8 pt-3 backdrop-blur-xl transition-transform duration-500 ease-glide", open ? "translate-y-0" : "translate-y-full")}
        >
          <div className="mb-3 flex items-center justify-between">
            <span aria-hidden className="mx-auto h-1 w-10 rounded-full bg-ghost" />
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-4 top-3 flex size-11 items-center justify-center rounded-full border border-white/15"><Icon.Close /></button>
          </div>
          <ul className="mt-6">
            {NAV_LINKS.map((l, i) => (
              <li key={l.href} className="border-b border-white/10 last:border-0">
                <Link href={l.href} onClick={() => setOpen(false)} className="flex h-16 items-center justify-between text-[32px] font-semibold tracking-[-0.04em]">
                  {l.label}<span className="font-mono text-xs font-normal text-dim">0{i + 1}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/reserve" onClick={() => setOpen(false)} className="flex h-13 items-center justify-center rounded-full bg-moon font-semibold text-night">Reserve</Link>
            <a href={whatsappUrl(site.whatsapp)} className="flex h-13 items-center justify-center gap-2 rounded-full border border-white/20"><Icon.WhatsApp /> WhatsApp</a>
          </div>
        </div>
      </div>
    </header>
  );
}
