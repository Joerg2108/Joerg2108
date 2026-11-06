"use client"

// Vertical timeline whose light beam fills as the visitor scrolls through it.
import { useEffect, useRef } from "react"
import { prefersReducedMotion } from "@/components/motion"

export function Timeline({ items }: { items: { year: string; text: string }[] }) {
  const wrap = useRef<HTMLOListElement>(null)
  const beam = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const w = wrap.current
    const b = beam.current
    if (!w || !b) return
    if (prefersReducedMotion()) {
      b.style.transform = "scaleY(1)"
      return
    }
    let raf = 0
    const update = () => {
      raf = 0
      const r = w.getBoundingClientRect()
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.6 - r.top) / r.height))
      b.style.transform = `scaleY(${p})`
      w.querySelectorAll<HTMLElement>("[data-node]").forEach((n) => {
        const nr = n.getBoundingClientRect()
        n.classList.toggle("is-lit", nr.top < window.innerHeight * 0.6)
      })
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  return (
    <ol ref={wrap} className="relative mx-auto max-w-4xl">
      <span aria-hidden="true" className="absolute bottom-0 left-[7.5rem] top-0 w-px bg-line sm:left-1/2" />
      <span ref={beam} aria-hidden="true" className="absolute left-[7.5rem] top-0 h-full w-px origin-top scale-y-0 bg-[image:linear-gradient(180deg,#ff5b3a,#8b7bff,#3ee6c8)] shadow-[0_0_14px_rgb(255_91_58/0.7)] sm:left-1/2" />
      {items.map((v, i) => (
        <li
          key={v.year + v.text}
          data-node
          className={`group relative grid grid-cols-[6.5rem_1fr] items-baseline gap-8 py-6 sm:grid-cols-2 sm:gap-16 [&.is-lit_.nc-dot]:scale-100 [&.is-lit_.nc-dot]:bg-primary [&.is-lit_.nc-dot]:shadow-[0_0_18px_#ff5b3a] [&.is-lit_.nc-year]:text-text`}
        >
          <span className={`nc-year font-display text-2xl italic text-dim transition-colors duration-700 sm:text-4xl ${i % 2 ? "sm:order-2" : "sm:text-right"}`}>{v.year}</span>
          <span className={`text-lg leading-relaxed text-muted ${i % 2 ? "sm:order-1 sm:text-right" : ""}`}>{v.text}</span>
          <span aria-hidden="true" className="nc-dot absolute left-[7.5rem] top-[2.15rem] h-3 w-3 -translate-x-1/2 scale-75 rounded-full border border-line bg-surface-2 transition-all duration-700 sm:left-1/2" />
        </li>
      ))}
    </ol>
  )
}
