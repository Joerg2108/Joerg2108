export function PageHero({ kicker, title, children }: { kicker?: string; title: string; children?: React.ReactNode }) {
  return (
    <section className="halftone border-b-2 border-ink">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        {kicker ? (
          <p className="mb-4 inline-block -rotate-1 border-2 border-ink bg-pop-yellow px-3 py-1 text-sm font-bold uppercase tracking-widest">
            {kicker}
          </p>
        ) : null}
        <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl">{title}</h1>
        {children ? <div className="mt-6 max-w-3xl text-lg leading-relaxed text-muted">{children}</div> : null}
      </div>
    </section>
  )
}

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-7xl px-4 sm:px-6 ${className}`}>{children}</div>
}

export function SectionTitle({ kicker, title, id }: { kicker?: string; title: string; id?: string }) {
  return (
    <div className="mb-10">
      {kicker ? <p className="mb-2 text-sm font-bold uppercase tracking-widest text-pop-red">{kicker}</p> : null}
      <h2 id={id} className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
        {title}
      </h2>
    </div>
  )
}
