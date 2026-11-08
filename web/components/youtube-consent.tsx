"use client"

// Two-click YouTube embed: nothing is loaded from Google until the visitor clicks.
// The poster is a local image, the player comes from youtube-nocookie.com.

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

export type YouTubeFilm = { id: string; title: string; poster: string; channel?: string }

export function YouTubeConsent({
  film,
  labels,
  privacyHref,
}: {
  film: YouTubeFilm
  labels: { play: string; consent: string; privacy: string; onYoutube: string }
  privacyHref: string
}) {
  const [on, setOn] = useState(false)
  const watch = `https://www.youtube.com/watch?v=${film.id}`
  return (
    <figure className="group">
      <div className="relative aspect-video overflow-hidden rounded-[1.5rem] border border-line bg-surface shadow-[var(--nc-shadow-float)]">
        {on ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${film.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={film.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setOn(true)}
            className="absolute inset-0 flex h-full w-full items-center justify-center text-left focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-gold"
          >
            <Image
              src={film.poster}
              alt=""
              fill
              sizes="(min-width: 1024px) 30vw, 92vw"
              className="object-cover opacity-70 transition duration-700 ease-[var(--nc-ease-out)] group-hover:scale-105 group-hover:opacity-90"
            />
            <span className="sr-only">{`${labels.play}: ${film.title}. `}</span>
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
            <span
              aria-hidden="true"
              className="relative grid h-16 w-16 place-items-center rounded-full border border-white/30 bg-white/10 backdrop-blur-md transition duration-500 ease-[var(--nc-ease-spring)] group-hover:scale-110 group-hover:bg-[rgb(255_91_58/0.85)]"
            >
              <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-white">
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
            </span>
            <span className="absolute inset-x-0 bottom-0 p-5 text-xs leading-snug text-text">{labels.consent}</span>
          </button>
        )}
      </div>
      <figcaption className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="min-w-0">
          <span className="block font-display text-xl italic leading-tight text-text">{film.title}</span>
          {film.channel && <span className="mt-1 block font-mono text-[0.68rem] uppercase tracking-widest text-muted">YouTube · {film.channel}</span>}
        </span>
        <span className="flex shrink-0 gap-4 text-sm">
          <Link href={privacyHref} className="text-muted underline underline-offset-4 hover:text-text">
            {labels.privacy}
          </Link>
          <a href={watch} target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-4 hover:text-text">
            {labels.onYoutube}
          </a>
        </span>
      </figcaption>
    </figure>
  )
}
