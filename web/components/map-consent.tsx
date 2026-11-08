"use client"

// Two-click Google Maps: until the visitor clicks, only a local, stylised placeholder is shown
// and no request goes to Google. The "Route" link always works without loading anything.

import Link from "next/link"
import { useState } from "react"

export function MapConsent({
  embedUrl,
  openUrl,
  title,
  address,
  privacyHref,
  labels,
}: {
  embedUrl: string
  openUrl: string
  title: string
  address: string[]
  privacyHref: string
  labels: { load: string; consent: string; open: string; privacy: string; kicker: string }
}) {
  const [on, setOn] = useState(false)
  return (
    <figure className="group relative">
      <div className="relative overflow-hidden rounded-[var(--nc-radius-l)] border border-line bg-surface shadow-[var(--nc-shadow-float)] min-h-[26rem] sm:aspect-[21/9] sm:min-h-0">
        {on ? (
          <iframe
            src={embedUrl}
            title={title}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            className="absolute inset-0 h-full w-full [filter:grayscale(0.35)_contrast(1.05)]"
          />
        ) : (
          <button
            type="button"
            onClick={() => setOn(true)}
            className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-5 p-6 text-center focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-gold"
          >
            {/* stilisierte Karte – reines CSS/SVG, kein externer Inhalt */}
            <span aria-hidden="true" className="absolute inset-0 opacity-60">
              <svg className="h-full w-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 340">
                <defs>
                  <pattern id="nc-map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M40 0H0V40" fill="none" stroke="rgb(255 255 255 / 0.05)" />
                  </pattern>
                </defs>
                <rect width="800" height="340" fill="url(#nc-map-grid)" />
                <g fill="none" strokeLinecap="round">
                  <path d="M-20 250C120 210 210 230 330 180S560 60 820 90" stroke="rgb(255 255 255 / 0.16)" strokeWidth="14" />
                  <path d="M120 -20C170 90 240 140 300 360" stroke="rgb(255 255 255 / 0.1)" strokeWidth="8" />
                  <path d="M520 -20C500 80 470 160 560 360" stroke="rgb(255 255 255 / 0.1)" strokeWidth="8" />
                  <path d="M-20 120C160 140 300 110 420 170S700 300 820 280" stroke="rgb(139 123 255 / 0.25)" strokeWidth="3" strokeDasharray="2 10" />
                </g>
                <path d="M600 60c40 10 80 40 70 80s-70 40-100 20-10-110 30-100z" fill="rgb(62 230 200 / 0.08)" />
              </svg>
            </span>
            <span aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--color-bg)_95%)]" />
            <span aria-hidden="true" className="relative grid h-14 w-14 place-items-center rounded-full bg-[rgb(255_91_58/0.9)] shadow-[0_0_0_10px_rgb(255_91_58/0.15),0_0_0_24px_rgb(255_91_58/0.07)] transition-transform duration-500 ease-[var(--nc-ease-spring)] group-hover:scale-110">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
                <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
              </svg>
            </span>
            <span className="relative">
              <span className="kicker block">{labels.kicker}</span>
              <span className="mt-2 block max-w-[22rem] font-display text-xl italic leading-snug text-text sm:max-w-none sm:text-2xl">{address.join(" · ")}</span>
            </span>
            <span className="relative rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-text backdrop-blur-md transition-colors group-hover:bg-white/20">
              {labels.load}
            </span>
            <span className="relative max-w-md text-xs leading-snug text-text">{labels.consent}</span>
          </button>
        )}
      </div>
      <figcaption className="mt-4 flex flex-wrap justify-end gap-4 text-sm">
        <Link href={privacyHref} className="text-muted underline underline-offset-4 hover:text-text">
          {labels.privacy}
        </Link>
        <a href={openUrl} target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-4 hover:text-text">
          {labels.open} ↗
        </a>
      </figcaption>
    </figure>
  )
}
