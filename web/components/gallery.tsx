"use client"

// Masonry gallery with floating glass cards and a cinematic lightbox.
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import type { UI } from "@/lib/i18n"
import { Tilt } from "@/components/motion"

export interface GalleryImage {
  src: string
  width?: number
  height?: number
  caption?: string
  /** MP4 shown in the lightbox; the image is its poster. */
  video?: string
}

export function Gallery({ images, title, t }: { images: GalleryImage[]; title: string; t: UI }) {
  const [index, setIndex] = useState<number | null>(null)
  const lastFocus = useRef<HTMLElement | null>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const close = useCallback(() => {
    setIndex(null)
    lastFocus.current?.focus()
  }, [])
  const step = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + images.length) % images.length)), [images.length])

  useEffect(() => {
    if (index === null) return
    const lenis = (window as unknown as { __lenis?: { stop(): void; start(): void } }).__lenis
    lenis?.stop()
    document.documentElement.style.overflow = "hidden"
    dialog.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
      if (e.key === "ArrowRight") step(1)
      if (e.key === "ArrowLeft") step(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.documentElement.style.overflow = ""
      lenis?.start()
      window.removeEventListener("keydown", onKey)
    }
  }, [index, close, step])

  if (!images.length) return <p className="text-muted">{t.imagesSoon}</p>
  const current = index === null ? null : images[index]

  return (
    <>
      <ul className="columns-1 gap-5 sm:columns-2 lg:columns-3">
        {images.map((img, i) => (
          <li key={img.src} data-reveal style={{ ["--i" as string]: i % 3 }} className="mb-5 break-inside-avoid">
            <Tilt max={6} className="rounded-[var(--nc-radius-m)]">
              <button
                type="button"
                onClick={(e) => {
                  lastFocus.current = e.currentTarget
                  setIndex(i)
                }}
                className="group relative block w-full overflow-hidden rounded-[var(--nc-radius-m)] border border-line bg-surface text-left shadow-[var(--nc-shadow-float)]"
              >
                <Image
                  src={img.src}
                  alt={img.video ? "" : img.caption || `${title} – ${t.imageN} ${i + 1}`}
                  width={img.width ?? 1200}
                  height={img.height ?? 800}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  loading="lazy"
                  className="h-auto w-full transition duration-[1200ms] ease-[var(--nc-ease-out)] group-hover:scale-[1.05]"
                />
                {img.video ? (
                  <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                    <span className="grid h-16 w-16 place-items-center rounded-full border border-white/30 bg-white/10 backdrop-blur-md transition duration-500 ease-[var(--nc-ease-spring)] group-hover:scale-110 group-hover:bg-[rgb(255_91_58/0.85)]">
                      <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-white">
                        <path d="M8 5.5v13l11-6.5z" />
                      </svg>
                    </span>
                  </span>
                ) : null}
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/85 via-bg/10 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-95" />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                  <span className="text-sm font-medium">{img.caption}</span>
                  {img.video ? null : (
                    <span className="glass-soft flex h-9 w-9 shrink-0 translate-y-2 items-center justify-center rounded-full text-xs opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                      ⤢
                    </span>
                  )}
                </span>
              </button>
            </Tilt>
          </li>
        ))}
      </ul>

      {current ? (
        <div
          ref={dialog}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={current.caption || title}
          className="fixed inset-0 z-[90] flex flex-col bg-bg/92 p-4 outline-none backdrop-blur-2xl sm:p-8"
          onClick={close}
        >
          <div className="flex items-center justify-between gap-4" onClick={(e) => e.stopPropagation()}>
            <p className="font-mono text-xs tracking-widest text-muted">
              {String(index! + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
              {current.caption ? <span className="ml-4 font-sans text-sm tracking-normal text-text">{current.caption}</span> : null}
            </p>
            <button type="button" onClick={close} className="glass-soft rounded-full px-4 py-2 text-sm">
              {t.closeX}
            </button>
          </div>
          <div className="relative my-4 min-h-0 flex-1" onClick={(e) => e.stopPropagation()}>
            {current.video ? (
              <video
                key={current.video}
                src={current.video}
                poster={current.src}
                controls
                autoPlay
                playsInline
                preload="metadata"
                aria-label={current.caption || title}
                className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,.6)]"
              />
            ) : (
              <Image key={current.src} src={current.src} alt={current.caption || title} fill sizes="100vw" className="animate-[nc-float_8s_ease-in-out_infinite] object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,.6)]" priority />
            )}
          </div>
          <div className="flex justify-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => step(-1)} className="glass-soft rounded-full px-6 py-2.5 text-sm">
              {t.back}
            </button>
            <button type="button" onClick={() => step(1)} className="rounded-full bg-text px-6 py-2.5 text-sm font-semibold text-bg">
              {t.next}
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
