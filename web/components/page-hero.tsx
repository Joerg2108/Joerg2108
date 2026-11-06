import { SplitWords } from "@/components/motion"
import { CinemaVideo, type Film } from "@/components/cinema-video"

/** Cinematic page header: glowing orbs (or a film), mono kicker, serif headline rising from a mask. */
export function PageHero({ kicker, title, children, film }: { kicker?: string; title: string; children?: React.ReactNode; film?: Film }) {
  return (
    <section className="relative isolate overflow-hidden pb-20 pt-40 sm:pb-28 sm:pt-52">
      {film ? (
        <CinemaVideo film={film} className="-z-10 opacity-60" />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <div className="nc-orb left-[-10%] top-[-20%] h-[38rem] w-[38rem] bg-primary/30" />
          <div className="nc-orb right-[-15%] top-[10%] h-[32rem] w-[32rem] bg-secondary/30 [animation-delay:-6s]" />
          <div className="nc-orb bottom-[-30%] left-[30%] h-[26rem] w-[26rem] bg-accent/15 [animation-delay:-12s]" />
        </div>
      )}
      <Container>
        {kicker ? (
          <p data-reveal className="kicker mb-8 flex items-center gap-3">
            <span className="h-px w-10 bg-[image:var(--nc-gradient-metal)]" />
            {kicker}
          </p>
        ) : null}
        <SplitWords as="h1" text={title} className="max-w-5xl font-display text-[clamp(3rem,9vw,8.5rem)] font-medium leading-[0.92] tracking-[-0.02em]" />
        {children ? (
          <div data-reveal style={{ ["--i" as string]: 3 }} className="mt-10 max-w-3xl text-lg leading-relaxed text-muted sm:text-xl">
            {children}
          </div>
        ) : null}
      </Container>
    </section>
  )
}

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-5 sm:px-8 ${className}`}>{children}</div>
}

export function SectionTitle({ kicker, title, id, lead, align = "left" }: { kicker?: string; title: string; id?: string; lead?: string; align?: "left" | "center" }) {
  return (
    <div className={`mb-14 ${align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}`}>
      {kicker ? (
        <p data-reveal className={`kicker mb-6 flex items-center gap-3 ${align === "center" ? "justify-center" : ""}`}>
          <span className="h-px w-8 bg-[image:var(--nc-gradient-metal)]" />
          {kicker}
        </p>
      ) : null}
      <SplitWords as="h2" id={id} text={title} className="font-display text-[clamp(2.4rem,5.5vw,4.8rem)] font-medium leading-[0.98] tracking-[-0.015em]" />
      {lead ? (
        <p data-reveal style={{ ["--i" as string]: 2 }} className="mt-6 text-lg leading-relaxed text-muted">
          {lead}
        </p>
      ) : null}
    </div>
  )
}

/** Primary / secondary buttons with light sweep and glow. */
export function ButtonLink({ href, children, variant = "primary", external = false }: { href: string; children: React.ReactNode; variant?: "primary" | "ghost"; external?: boolean }) {
  const cls =
    variant === "primary"
      ? "bg-text text-bg hover:shadow-[var(--nc-shadow-glow)]"
      : "glass-soft text-text hover:border-white/30"
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`group relative inline-flex items-center gap-3 overflow-hidden rounded-full px-7 py-3.5 text-sm font-semibold tracking-wide transition-all duration-500 ease-[var(--nc-ease-out)] hover:-translate-y-0.5 ${cls}`}
    >
      {variant === "primary" ? (
        <span className="absolute inset-0 translate-y-full bg-[image:var(--nc-gradient-aurora)] transition-transform duration-500 ease-[var(--nc-ease-out)] group-hover:translate-y-0" />
      ) : null}
      <span className={`relative ${variant === "primary" ? "group-hover:text-white" : ""}`}>{children}</span>
      <span className={`relative transition-transform duration-500 ease-[var(--nc-ease-out)] group-hover:translate-x-1 ${variant === "primary" ? "group-hover:text-white" : ""}`}>→</span>
    </a>
  )
}
