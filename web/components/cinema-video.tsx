"use client"

// Ambient cinematic video: muted, looping, inline, lazy.
// - nothing is downloaded until the element comes near the viewport
// - plays only while visible, pauses otherwise (saves battery and CPU)
// - phones (< 768 px) get the poster only, with a slow Ken-Burns zoom (saves 1–1.5 MB per film)
// - larger screens get WebM (VP9) or MP4 1080p
// - "prefers-reduced-motion" and "Save-Data" show the poster only
import { useEffect, useRef, useState } from "react"
import { prefersReducedMotion } from "@/components/motion"

export interface Film {
  /** base path without suffix, e.g. "/media/hero" → hero-1080.webm, hero-1080.mp4, hero-540.mp4, hero-poster.webp */
  base: string
}

/** Phones get stills instead of films: background video is the biggest download on mobile. */
export const isPhone = () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches

export function CinemaVideo({ film, className = "", overlay = true }: { film: Film; className?: string; overlay?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [load, setLoad] = useState(false)
  const [still, setStill] = useState(false)
  const [phone, setPhone] = useState(false)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    const saveData = (navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData
    if (prefersReducedMotion() || saveData) {
      setStill(true)
      return
    }
    if (isPhone()) {
      setStill(true)
      setPhone(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setLoad(true)
          v.play().catch(() => {})
        } else v.pause()
      },
      { rootMargin: "200px 0px" },
    )
    io.observe(v)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (load) ref.current?.load()
  }, [load])

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <video
        ref={ref}
        className={`h-full w-full scale-[1.02] object-cover ${phone ? "animate-[nc-kenburns_24s_ease-in-out_infinite_alternate]" : ""}`}
        poster={`${film.base}-poster.webp`}
        muted
        loop
        playsInline
        autoPlay={!still}
        preload="none"
        disablePictureInPicture
        tabIndex={-1}
      >
        {load && !still ? (
          <>
            <source src={`${film.base}-1080.webm`} type="video/webm" />
            <source src={`${film.base}-1080.mp4`} type="video/mp4" />
          </>
        ) : null}
      </video>
      {overlay ? (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,var(--nc-bg)_85%)] opacity-90" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[image:var(--nc-gradient-fade)]" />
        </>
      ) : null}
    </div>
  )
}
