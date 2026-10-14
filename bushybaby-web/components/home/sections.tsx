import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import { AuroraText, BorderBeam, DotPattern, MagicCard, Marquee, ShimmerButton } from "@/components/magicui";
import { Reveal, WordRise } from "@/components/reveal";
import { Icon } from "@/components/site/logo";
import { Faq } from "./faq";
import { site } from "@/lib/site";
import { whatsappUrl } from "@/lib/whatsapp";
import { acts, faqs, ingredients, plans, reviews, signatures, spaceFacts } from "@/content/home";

const px = "px-5 md:px-[clamp(20px,5vw,80px)]";
const h2 = "display text-[clamp(44px,5.6vw,88px)] leading-[0.95] tracking-[-0.045em]";

function Kicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={clsx("label-mono", className)}>{children}</span>;
}

/* ── 01 HERO ─────────────────────────────────────────────────────────────── */
export function Hero() {
  const meta = [
    ["Hours", site.openingHours.length ? `${site.openingHours[0].opens} — late` : "[Daily · 17:00 — late]"],
    ["Find us", site.address.town ? `${site.address.town}, Kenya` : "[Town], Kenya"],
    ["Say hi", "@bushybaby_tikipub"],
  ];
  return (
    <section aria-labelledby="hero-h" className={clsx("relative -mt-[92px] min-h-[100svh] pb-16 pt-44 lg:pt-52", px)}>
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <DotPattern className="text-white/15 [mask-image:radial-gradient(900px_circle_at_70%_40%,white,transparent)]" />
        <div className="absolute -right-32 top-10 size-[720px] rounded-full bg-violet opacity-[0.14] blur-[140px]" />
        <div className="absolute right-[360px] top-96 size-[560px] rounded-full bg-amber opacity-[0.12] blur-[140px]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <div className="flex flex-col gap-8">
          <span className="label-mono inline-flex h-8 items-center self-start rounded-full border border-white/12 bg-white/[0.03] px-3.5 text-mist">
            N° 01 — Tiki pub · {site.address.town ?? "[Town]"}, Kenya
          </span>
          <h1 id="hero-h" className="display text-[clamp(64px,9.2vw,148px)]">
            <WordRise text="Wide awake" />
            <br />
            <AuroraText>after dark.</AuroraText>
          </h1>
          <p className="max-w-[480px] text-xl leading-relaxed text-mist text-pretty">
            A hand-built tiki pub under a thatched makuti roof. Fresh fruit, honest rum and long, fire-lit nights — kept by a bushbaby that never sleeps.
          </p>
          <div className="flex flex-wrap items-center gap-3.5">
            <ShimmerButton href="/reserve">Reserve tonight</ShimmerButton>
            <Link href="/menu" className="inline-flex h-14 items-center gap-2.5 rounded-full border border-white/15 px-6 font-medium transition-colors hover:border-white/30">
              See the menu <Icon.ArrowUpRight />
            </Link>
          </div>
        </div>

        {/* 3D photo stack — decorative, so hidden from AT. Hidden < lg (moves into the signatures below). */}
        <div aria-hidden className="relative hidden h-[680px] [perspective:1600px] lg:block">
          <FloatCard className="left-[4%] top-[120px] h-[380px] w-[280px]" tilt="rotateY(18deg) rotateX(4deg)" src="/images/whole-melon.jpg" delay="0s" />
          <FloatCard className="right-[2%] top-0 z-10 h-[440px] w-[320px]" tilt="rotateY(-14deg) rotateX(2deg)" src="/images/sundown-hurricane.jpg" delay="-3s" priority />
          <FloatCard className="bottom-0 left-[30%] z-20 h-[300px] w-[260px]" tilt="rotateY(8deg) rotateX(-6deg)" src="/images/mango-mint.jpg" delay="-6s" />
          <div className="absolute bottom-[120px] right-0 z-30 flex flex-col gap-1 rounded-[18px] border border-white/15 bg-surface-2/55 px-[18px] py-3.5 backdrop-blur-xl">
            <span className="label-mono text-[11px] text-mist">Tonight</span>
            <span className="text-[15px] font-semibold">[DJ set from 21:00]</span>
          </div>
          <div className="absolute left-0 top-10 z-30 rounded-full border border-white/15 bg-surface-2/55 px-4 py-3 text-[13px] font-medium backdrop-blur-xl">Served in a whole watermelon</div>
        </div>
      </div>

      <dl className="relative mx-auto mt-16 grid max-w-7xl grid-cols-2 gap-6 border-t border-white/10 pt-6 md:grid-cols-4">
        {meta.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-1.5">
            <dt className="label-mono">{k}</dt>
            <dd className="text-[15px]">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function FloatCard({ className, tilt, src, delay, priority }: { className: string; tilt: string; src: string; delay: string; priority?: boolean }) {
  return (
    <div className={clsx("absolute animate-float", className)} style={{ animationDelay: delay }}>
      <div className="relative size-full overflow-hidden rounded-card border border-white/15 shadow-[0_60px_140px_-20px_rgba(0,0,0,0.9)]" style={{ transform: tilt }}>
        <Image src={src} alt="" fill sizes="320px" priority={priority} className="object-cover" />
      </div>
    </div>
  );
}

/* ── MARQUEE ─────────────────────────────────────────────────────────────── */
export function IngredientMarquee() {
  return (
    <section aria-label="What goes into the glass" className="border-y border-white/10 py-7 [mask-image:linear-gradient(90deg,transparent,white_12%,white_88%,transparent)]">
      <Marquee pauseOnHover duration="45s">
        {ingredients.map((w, i) => (
          <span key={w} className={clsx("inline-flex items-center gap-12 whitespace-nowrap text-[clamp(36px,4vw,56px)] font-semibold tracking-[-0.04em]", i % 2 ? "text-ghost" : "text-moon")}>
            {w}
            <Icon.Spark className="text-[#3a3a3a]" />
          </span>
        ))}
      </Marquee>
    </section>
  );
}

/* ── 02 SIGNATURES ───────────────────────────────────────────────────────── */
export function Signatures() {
  return (
    <section aria-labelledby="sig-h" className={clsx("pb-28 pt-40", px)}>
      <div className="mx-auto flex max-w-7xl flex-col gap-16">
        <Reveal className="flex flex-wrap items-end justify-between gap-8">
          <div className="flex max-w-3xl flex-col gap-5">
            <Kicker>02 — Signatures</Kicker>
            <h2 id="sig-h" className={h2}>Three drinks.<br /><span className="text-dim">The whole coast in them.</span></h2>
          </div>
          <Link href="/menu" className="inline-flex items-center gap-2.5 border-b border-white/30 pb-1.5 font-medium hover:text-amber">Full menu <Icon.Arrow /></Link>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {signatures.map((s, i) => (
            <Reveal key={s.no} delay={i * 0.08}>
              <MagicCard className="h-full">
                <article className="group/card flex h-full flex-col">
                  <div className="relative m-2 h-[420px] overflow-hidden rounded-[22px]">
                    <Image src={s.image} alt={s.alt} fill sizes="(min-width:1024px) 400px, (min-width:768px) 50vw, 100vw" className="object-cover transition-transform duration-[1200ms] ease-land group-hover/card:scale-105" />
                    <span className="label-mono absolute left-3.5 top-3.5 inline-flex h-7 items-center rounded-full bg-night/60 px-3 text-[11px] text-moon backdrop-blur-md">{s.no}</span>
                  </div>
                  <div className="flex flex-col gap-2.5 px-6 pb-7 pt-5">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="text-[26px] font-semibold tracking-[-0.03em]">{s.name}</h3>
                      <span className="font-mono text-[13px] text-mist">{s.price ?? "[KES —]"}</span>
                    </div>
                    <p className="text-[15px] leading-relaxed text-mist">{s.notes}</p>
                  </div>
                </article>
              </MagicCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 03 FOUR ACTS ────────────────────────────────────────────────────────── */
export function FourActs() {
  return (
    <section aria-labelledby="acts-h" className={clsx("pb-40 pt-28", px)}>
      <div className="mx-auto flex max-w-7xl flex-col gap-20">
        <Reveal className="grid items-end gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <Kicker>03 — A night at BushyBaby</Kicker>
            <h2 id="acts-h" className={h2}>The night,<br />in four acts.</h2>
          </div>
          <p className="max-w-md text-lg leading-relaxed text-mist">Bushbabies wake when the sun goes down. So do we. Come early for the light, stay late for the stories.</p>
        </Reveal>
        <ol className="grid border-t border-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {acts.map((a, i) => (
            <li key={a.roman} className="relative pb-12 pr-7 pt-10">
              <span aria-hidden className="absolute -top-1.5 left-0 size-[11px] rounded-full" style={{ background: a.dot, boxShadow: `0 0 24px ${a.dot}` }} />
              <Reveal delay={i * 0.1} className="flex flex-col gap-4">
                <span className="font-mono text-[13px] text-mist">[{a.time}]</span>
                <span aria-hidden className="text-[64px] font-light leading-none tracking-[-0.04em] text-[#3f3f3f]">{a.roman}</span>
                <h3 className="text-2xl font-semibold tracking-[-0.02em]">{a.title}</h3>
                <p className="max-w-[260px] text-[15px] leading-relaxed text-mist">{a.body}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ── 04 THE SPACE ────────────────────────────────────────────────────────── */
export function TheSpace() {
  return (
    <section aria-labelledby="space-h" className="px-3 md:px-[clamp(12px,2vw,32px)]">
      <Reveal className="relative mx-auto h-[760px] max-w-[1376px] overflow-hidden rounded-panel border border-white/10 md:h-[860px]">
        <Image src="/images/bar-night.jpg" alt="The BushyBaby bar at night: thatched roof, hand-painted tiki panels and a glowing red bar front" fill sizes="(min-width:1376px) 1376px, 100vw" className="object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-night/20 via-night/10 to-night/95" />
        <div className="absolute inset-x-6 bottom-6 flex flex-wrap items-end justify-between gap-10 md:inset-x-16 md:bottom-16">
          <div className="flex max-w-xl flex-col gap-4">
            <Kicker className="text-neutral-300">04 — The space</Kicker>
            <h2 id="space-h" className="display text-[clamp(40px,5vw,80px)] leading-[0.95] tracking-[-0.045em]">Built by hand.<br />Lit by night.</h2>
          </div>
          <dl className="grid w-full grid-cols-2 gap-px overflow-hidden rounded-tile border border-white/12 bg-white/12 sm:w-auto sm:min-w-[440px]">
            {spaceFacts.map(([k, v]) => (
              <div key={k} className="bg-night/70 px-5 py-4 backdrop-blur-lg">
                <dt className="label-mono text-[11px] text-mist">{k}</dt>
                <dd className="mt-1.5 font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>
    </section>
  );
}

/* ── 05 WAYS TO STAY ─────────────────────────────────────────────────────── */
export function WaysToStay() {
  return (
    <section aria-labelledby="stay-h" className={clsx("pb-36 pt-44", px)}>
      <div className="mx-auto flex max-w-7xl flex-col gap-16">
        <Reveal className="flex flex-col items-center gap-5 text-center">
          <Kicker>05 — Ways to stay</Kicker>
          <h2 id="stay-h" className={h2}>Pull up a stool,<br />or take the whole jungle.</h2>
        </Reveal>
        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((p, i) => (
            <Reveal key={p.kicker} delay={i * 0.08}>
              <div className={clsx("relative flex h-full flex-col gap-7 overflow-hidden rounded-card border p-9 transition-[transform,border-color] duration-500 ease-land hover:-translate-y-1.5", p.featured ? "border-white/15 bg-gradient-to-b from-[#1a1a1a] to-surface-1" : "border-white/10 bg-surface-1 hover:border-white/20")}>
                {p.featured && <BorderBeam />}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="label-mono text-mist">{p.kicker}</span>
                    {p.featured && <span className="inline-flex h-[26px] items-center rounded-full bg-moon px-2.5 text-[11px] font-semibold tracking-[0.06em] text-night">RECOMMENDED</span>}
                  </div>
                  <span className="text-[52px] font-semibold tracking-[-0.04em]">{p.price}</span>
                  <span className="text-[15px] text-mist">{p.sub}</span>
                </div>
                <ul className="flex flex-col gap-3.5 border-t border-white/10 pt-6 text-[15px] text-neutral-300">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-3"><Icon.Check className={p.featured ? "text-amber" : "text-mist"} />{f}</li>
                  ))}
                </ul>
                <Link href={p.cta.href} className={clsx("mt-auto flex h-13 items-center justify-center rounded-full text-[15px]", p.featured ? "bg-moon font-semibold text-night" : "border border-white/15 font-medium hover:border-white/30")}>{p.cta.label}</Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 06 REVIEWS (hidden until real reviews exist) ────────────────────────── */
export function Reviews() {
  if (!reviews.length) return null;
  return (
    <section aria-labelledby="rev-h" className="flex flex-col gap-14 pb-40 pt-10">
      <Reveal className={px}>
        <div className="mx-auto flex max-w-7xl flex-col gap-5">
          <Kicker>06 — Overheard at the bar</Kicker>
          <h2 id="rev-h" className={h2}>Said with a<br />straw in hand.</h2>
        </div>
      </Reveal>
      <div className="[mask-image:linear-gradient(90deg,transparent,white_10%,white_90%,transparent)]">
        <Marquee pauseOnHover duration="60s" gap="1.25rem" repeat={2}>
          {reviews.map((r) => (
            <figure key={r.quote} className="flex w-[380px] flex-col gap-6 rounded-3xl border border-white/10 bg-surface-1 p-7">
              <blockquote className="text-lg font-medium leading-normal text-neutral-300">“{r.quote}”</blockquote>
              <figcaption className="label-mono">{r.who}</figcaption>
            </figure>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

/* ── 07 FAQ ──────────────────────────────────────────────────────────────── */
export function FaqSection() {
  return (
    <section aria-labelledby="faq-h" className={clsx("pb-40", px)}>
      <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2">
        <Reveal className="flex flex-col gap-5">
          <Kicker>07 — Good to know</Kicker>
          <h2 id="faq-h" className="display text-[clamp(44px,5vw,72px)] leading-[0.95] tracking-[-0.045em]">Before you<br />come over.</h2>
        </Reveal>
        <Faq items={faqs} />
      </div>
    </section>
  );
}

/* ── CTA ─────────────────────────────────────────────────────────────────── */
export function FinalCta() {
  return (
    <section aria-labelledby="cta-h" className="px-3 pb-8 md:px-[clamp(12px,2vw,32px)]">
      <div className="relative mx-auto flex max-w-[1376px] flex-col items-center gap-9 overflow-hidden rounded-panel border border-white/10 bg-[#0f0f0f] px-6 py-[clamp(72px,10vw,160px)] text-center">
        <div aria-hidden className="absolute -bottom-[380px] left-1/2 h-[600px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,170,64,0.35),rgba(156,64,255,0.18)_60%,transparent)]" />
        <Kicker className="relative text-mist">The bar opens at [18:00]</Kicker>
        <h2 id="cta-h" className="display relative text-[clamp(56px,8.4vw,136px)]">See you<br />after dark.</h2>
        <div className="relative flex flex-wrap justify-center gap-3.5">
          <Link href="/reserve" className="inline-flex h-14 items-center rounded-full bg-moon px-7 font-semibold text-night">Reserve a table</Link>
          <a href={whatsappUrl(site.whatsapp, "Hi BushyBaby!")} className="inline-flex h-14 items-center gap-2.5 rounded-full border border-white/20 bg-night/40 px-6 font-medium"><Icon.WhatsApp /> WhatsApp us</a>
        </div>
      </div>
    </section>
  );
}
