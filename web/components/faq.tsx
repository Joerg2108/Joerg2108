"use client"

import { useState } from "react"

/** Accordion: one answer open at a time, animated height via CSS grid rows. */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((it, i) => {
        const isOpen = open === i
        return (
          <li key={it.q} data-reveal style={{ ["--i" as string]: i }}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-${i}`}
                id={`faq-q-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="group flex w-full items-center justify-between gap-6 py-7 text-left"
              >
                <span className="font-display text-2xl leading-snug transition-colors duration-300 group-hover:text-gold sm:text-3xl">{it.q}</span>
                <span
                  aria-hidden="true"
                  className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line transition-all duration-500 ease-[var(--nc-ease-out)] ${isOpen ? "rotate-45 border-primary bg-primary/15" : "group-hover:border-white/30"}`}
                >
                  <span className="absolute h-px w-4 bg-text" />
                  <span className="absolute h-4 w-px bg-text" />
                </span>
              </button>
            </h3>
            <div
              id={`faq-${i}`}
              role="region"
              aria-labelledby={`faq-q-${i}`}
              className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--nc-ease-out)] ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <p className="max-w-3xl pb-8 text-lg leading-relaxed text-muted">{it.a}</p>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
