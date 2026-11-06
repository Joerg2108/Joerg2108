"use client"

// Single-file ambient loop (e.g. the portrait atelier clip): loads and plays only near the viewport.
import { useEffect, useRef, useState } from "react"
import { prefersReducedMotion } from "@/components/motion"

export function AmbientClip({ src, poster, className = "" }: { src: string; poster: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const v = ref.current
    if (!v || prefersReducedMotion()) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true)
          v.play().catch(() => {})
        } else v.pause()
      },
      { rootMargin: "200px 0px" },
    )
    io.observe(v)
    return () => io.disconnect()
  }, [])
  return <video ref={ref} className={className} src={on ? src : undefined} poster={poster} muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} />
}
