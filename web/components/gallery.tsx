"use client"

import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import type { UI } from "@/lib/i18n"

export interface GalleryImage {
  src: string
  width?: number
  height?: number
  caption?: string
}

export function Gallery({ images, title, t }: { images: GalleryImage[]; title: string; t: UI }) {
  const [index, setIndex] = useState<number | null>(null)
  const close = useCallback(() => setIndex(null), [])
  const step = useCallback(
    (d: number) => setIndex((i) => (i === null ? i : (i + d + images.length) % images.length)),
    [images.length],
  )

  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
      if (e.key === "ArrowRight") step(1)
      if (e.key === "ArrowLeft") step(-1)
    }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [index, close, step])

  if (!images.length) {
    return <p className="text-muted">{t.imagesSoon}</p>
  }

  const current = index === null ? null : images[index]

  return (
    <>
      <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {images.map((img, i) => (
          <li key={img.src} className="mb-4 break-inside-avoid">
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group block w-full overflow-hidden rounded-lg border-2 border-ink bg-white text-left transition hover:-translate-y-1 hover:pop-shadow focus-visible:outline-4 focus-visible:outline-pop-yellow"
            >
              <Image
                src={img.src}
                alt={img.caption || `${title} – ${t.imageN} ${i + 1}`}
                width={img.width ?? 1200}
                height={img.height ?? 800}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="h-auto w-full transition duration-500 group-hover:scale-[1.03]"
              />
              {img.caption ? (
                <span className="block border-t-2 border-ink px-3 py-2 text-sm font-semibold">{img.caption}</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      {current ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.caption || title}
          className="fixed inset-0 z-[90] flex flex-col bg-ink/95 p-4 text-paper"
          onClick={close}
        >
          <div className="flex items-center justify-between gap-4 text-sm">
            <span>
              {index! + 1} / {images.length}
              {current.caption ? ` · ${current.caption}` : ""}
            </span>
            <button type="button" onClick={close} className="rounded border border-paper px-3 py-1 font-bold">
              {t.closeX}
            </button>
          </div>
          <div className="relative min-h-0 flex-1" onClick={(e) => e.stopPropagation()}>
            <Image
              src={current.src}
              alt={current.caption || title}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>
          <div className="flex justify-center gap-4 pt-3" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => step(-1)} className="rounded bg-pop-yellow px-5 py-2 font-bold text-ink">
              {t.back}
            </button>
            <button type="button" onClick={() => step(1)} className="rounded bg-pop-yellow px-5 py-2 font-bold text-ink">
              {t.next}
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
