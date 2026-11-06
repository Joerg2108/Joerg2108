"use client"

// Motion primitives for the NOIR CHROMA design system.
// - SmoothScroll: Lenis inertia scrolling, synced with GSAP's ticker and ScrollTrigger
// - RevealObserver: one IntersectionObserver for every [data-reveal] / .nc-split element
// - SplitWords: mask-reveal headline, word by word (works for CJK: splits per character group)
// - Tilt: 3D tilt + spotlight following the pointer
// - Magnetic: element drifts towards the pointer
// - Counter: animated number when visible
// All of them stand still when the visitor prefers reduced motion.

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

export function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return
    let destroyed = false
    let cleanup = () => {}
    ;(async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ])
      if (destroyed) return
      gsap.registerPlugin(ScrollTrigger)
      const lenis = new Lenis({ duration: 1.15, easing: (t: number) => 1 - Math.pow(1 - t, 4), smoothWheel: true })
      lenis.on("scroll", ScrollTrigger.update)
      const tick = (time: number) => lenis.raf(time * 1000)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)
      ;(window as unknown as { __lenis?: unknown }).__lenis = lenis
      // anchor links glide instead of jumping
      const onClick = (e: MouseEvent) => {
        const a = (e.target as HTMLElement).closest("a[href*='#']") as HTMLAnchorElement | null
        if (!a || a.origin !== location.origin || a.pathname !== location.pathname) return
        const el = a.hash && document.querySelector(decodeURIComponent(a.hash))
        if (!el) return
        e.preventDefault()
        lenis.scrollTo(el as HTMLElement, { offset: -88 })
        history.replaceState(null, "", a.hash)
      }
      document.addEventListener("click", onClick)
      cleanup = () => {
        document.removeEventListener("click", onClick)
        gsap.ticker.remove(tick)
        lenis.destroy()
      }
    })()
    return () => {
      destroyed = true
      cleanup()
    }
  }, [])
  return null
}

export function RevealObserver() {
  const pathname = usePathname()
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal], .nc-split"))
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in")
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    )
    els.forEach((el) => !el.classList.contains("is-in") && io.observe(el))
    return () => io.disconnect()
  }, [pathname])
  return null
}

/** Headline that rises out of a mask, word by word. CJK text is split into short groups. */
export function SplitWords({
  text,
  as: Tag = "span",
  className = "",
  delay = 0,
  id,
}: {
  id?: string
  text: string
  as?: "h1" | "h2" | "h3" | "p" | "span"
  className?: string
  delay?: number
}) {
  const cjk = /[㐀-鿿]/.test(text)
  const parts = cjk ? text.match(/[㐀-鿿　-〿＀-￯]{1,4}|[^㐀-鿿　-〿＀-￯]+/g) ?? [text] : text.split(/(\s+)/)
  let w = 0
  return (
    <Tag id={id} className={`nc-split ${className}`} style={{ ["--d" as string]: `${delay}ms` }}>
      {parts.map((p, i) =>
          /^\s+$/.test(p) ? (
            <span key={i}> </span>
          ) : (
            <span key={i} className="nc-word">
              <span style={{ ["--w" as string]: w++ }}>{p}</span>
            </span>
          ),
      )}
    </Tag>
  )
}

/** Tilts its child in 3D and moves a spotlight with the pointer. */
export function Tilt({ children, className = "", max = 8 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion() || window.matchMedia("(hover: none)").matches) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = (e.clientY - r.top) / r.height
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--mx", `${x * 100}%`)
        el.style.setProperty("--my", `${y * 100}%`)
        el.style.transform = `perspective(1100px) rotateX(${(0.5 - y) * max}deg) rotateY(${(x - 0.5) * max}deg) translateZ(0)`
      })
    }
    const onLeave = () => {
      cancelAnimationFrame(raf)
      el.style.transform = ""
    }
    el.addEventListener("pointermove", onMove)
    el.addEventListener("pointerleave", onLeave)
    return () => {
      el.removeEventListener("pointermove", onMove)
      el.removeEventListener("pointerleave", onLeave)
      cancelAnimationFrame(raf)
    }
  }, [max])
  return (
    <div
      ref={ref}
      className={`nc-spotlight transition-transform duration-500 ease-[var(--nc-ease-out)] will-change-transform [transform-style:preserve-3d] ${className}`}
    >
      {children}
    </div>
  )
}

/** Pulls its child a few pixels towards the pointer. */
export function Magnetic({ children, strength = 0.28, className = "" }: { children: React.ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion() || window.matchMedia("(hover: none)").matches) return
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const x = e.clientX - (r.left + r.width / 2)
      const y = e.clientY - (r.top + r.height / 2)
      el.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`
    }
    const onLeave = () => (el.style.transform = "")
    el.addEventListener("pointermove", onMove)
    el.addEventListener("pointerleave", onLeave)
    return () => {
      el.removeEventListener("pointermove", onMove)
      el.removeEventListener("pointerleave", onLeave)
    }
  }, [strength])
  return (
    <span ref={ref} className={`inline-block transition-transform duration-500 ease-[var(--nc-ease-spring)] ${className}`}>
      {children}
    </span>
  )
}

/** Counts up to `to` once visible. `format` keeps locale-specific separators. */
export function Counter({ to, prefix = "", suffix = "", locale = "de-DE" }: { to: number; prefix?: string; suffix?: string; locale?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(to)
  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    setValue(0)
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const start = performance.now()
      const dur = 1800
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / dur)
        setValue(Math.round(to * (1 - Math.pow(1 - t, 4))))
        if (t < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [to])
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {new Intl.NumberFormat(locale).format(value)}
      {suffix}
    </span>
  )
}

/** Thin progress bar at the top that follows the scroll position. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const update = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight
      if (ref.current) ref.current.style.transform = `scaleX(${h > 0 ? window.scrollY / h : 0})`
      raf = 0
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  return <div ref={ref} aria-hidden="true" className="fixed left-0 top-0 z-[70] h-[2px] w-full origin-left scale-x-0 bg-[image:var(--nc-gradient-aurora)]" />
}
