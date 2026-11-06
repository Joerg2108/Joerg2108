"use client"

// Portfolio as a horizontal camera move: on large screens the section pins and the
// cards glide sideways while the visitor scrolls (GSAP ScrollTrigger). On touch / small
// screens it becomes a native snap carousel. Reduced motion: native carousel too.
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef } from "react"
import { prefersReducedMotion, Tilt } from "@/components/motion"

export interface WorkCard {
  href: string
  title: string
  count: string
  image?: string
}

export function HorizontalWorks({ cards }: { cards: WorkCard[] }) {
  const section = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const s = section.current
    const tr = track.current
    if (!s || !tr || prefersReducedMotion() || !window.matchMedia("(min-width: 1024px) and (hover: hover)").matches) return
    let ctx: { revert(): void } | null = null
    let cancelled = false
    ;(async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)
      ctx = gsap.context(() => {
        const distance = () => tr.scrollWidth - window.innerWidth + 64
        gsap.to(tr, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: { trigger: s, start: "top top", end: () => `+=${distance()}`, scrub: 0.8, pin: true, invalidateOnRefresh: true, anticipatePin: 1 },
        })
        gsap.utils.toArray<HTMLElement>("[data-depth]").forEach((el) => {
          gsap.fromTo(el, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: s, start: "top top", end: () => `+=${distance()}`, scrub: true } })
        })
      }, s)
      ScrollTrigger.refresh()
    })()
    return () => {
      cancelled = true
      ctx?.revert()
    }
  }, [])

  return (
    <div ref={section} className="overflow-hidden lg:flex lg:h-svh lg:items-center">
      <ul
        ref={track}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-6 [scrollbar-width:none] sm:px-8 lg:snap-none lg:overflow-visible lg:px-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:pb-0"
      >
        {cards.map((c, i) => (
          <li key={c.href} className="w-[78vw] shrink-0 snap-center sm:w-[46vw] lg:w-[30rem]" style={{ marginTop: i % 2 ? "3.5rem" : 0 }}>
            <Tilt max={7} className="rounded-[var(--nc-radius-l)]">
              <Link href={c.href} className="group relative block aspect-[3/4] overflow-hidden rounded-[var(--nc-radius-l)] border border-line bg-surface shadow-[var(--nc-shadow-float)]">
                {c.image ? (
                  <div data-depth className="absolute -inset-[8%]">
                    <Image src={c.image} alt="" fill sizes="(min-width: 1024px) 30rem, 80vw" className="object-cover opacity-80 transition duration-[1400ms] ease-[var(--nc-ease-out)] group-hover:scale-110 group-hover:opacity-100" />
                  </div>
                ) : null}
                <span className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
                <span className="absolute inset-x-0 top-0 flex items-center justify-between p-6 font-mono text-[0.7rem] tracking-widest text-muted">
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span className="glass-soft rounded-full px-3 py-1">{c.count}</span>
                </span>
                <span className="absolute inset-x-0 bottom-0 p-6 [transform:translateZ(40px)]">
                  <span className="block font-display text-4xl italic leading-none sm:text-5xl">{c.title}</span>
                  <span className="mt-4 block h-px w-0 bg-[image:var(--nc-gradient-aurora)] transition-all duration-700 ease-[var(--nc-ease-out)] group-hover:w-full" />
                </span>
              </Link>
            </Tilt>
          </li>
        ))}
      </ul>
    </div>
  )
}
