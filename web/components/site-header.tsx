"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { nav, site } from "@/lib/content"

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="font-display text-2xl font-extrabold tracking-tight" onClick={() => setOpen(false)}>
          Fischer<span className="text-pop-red">-</span>Art
        </Link>

        <nav aria-label="Hauptnavigation" className="hidden lg:block">
          <ul className="flex items-center gap-1 text-sm font-semibold">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="rounded px-3 py-2 hover:bg-pop-yellow focus-visible:bg-pop-yellow">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <a
            href={site.shopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pop-shadow-sm rounded border-2 border-ink bg-pop-red px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5"
          >
            Shop
          </a>
        </div>

        <button
          type="button"
          className="rounded border-2 border-ink px-3 py-1.5 text-sm font-bold lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Schließen" : "Menü"}
        </button>
      </div>

      {open ? (
        <nav id="mobile-nav" aria-label="Mobile Navigation" className="border-t-2 border-ink bg-paper lg:hidden">
          <ul className="mx-auto grid max-w-7xl gap-1 px-4 py-4 text-lg font-semibold">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="block rounded px-3 py-2 hover:bg-pop-yellow" onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <a href={site.shopUrl} target="_blank" rel="noopener noreferrer" className="block rounded px-3 py-2 text-pop-red">
                Shop ↗
              </a>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  )
}
