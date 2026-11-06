import Image from "next/image"
import Link from "next/link"
import { getContent } from "@/lib/content"
import { getWorks } from "@/lib/works"
import { localeNames, lp, ui, type Locale } from "@/lib/i18n"
import { getLocale, alternates, type LocaleParams } from "@/lib/locale-params"
import { ButtonLink, Container, SectionTitle } from "@/components/page-hero"
import { ContactSection } from "@/components/contact-section"
import { CinemaVideo } from "@/components/cinema-video"
import { HeroScene } from "@/components/hero-scene"
import { HorizontalWorks } from "@/components/horizontal-works"
import { Faq } from "@/components/faq"
import { AmbientClip } from "@/components/ambient-clip"
import { Counter, Magnetic, SplitWords, Tilt } from "@/components/motion"

export async function generateMetadata({ params }: LocaleParams) {
  return { alternates: alternates(await getLocale(params), "/") }
}

const statUnits: Record<Locale, { pre: string[]; unit: string[] }> = {
  de: { pre: ["über", "fast", "über"], unit: ["qm", "Liter", ""] },
  en: { pre: ["over", "almost", "over"], unit: ["m²", "litres", ""] },
  zh: { pre: ["逾", "近", "逾"], unit: ["平方米", "升", "座"] },
}

function Quote({ text, author, open }: { text: string; author: string; open: string }) {
  return (
    <section className="relative isolate overflow-hidden py-32 sm:py-48">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="nc-orb left-[30%] top-[10%] h-[34rem] w-[34rem] bg-secondary/20" />
      </div>
      <Container>
        <figure className="mx-auto max-w-5xl text-center">
          <span aria-hidden="true" className="text-metal block font-display text-8xl leading-none">
            {open}
          </span>
          <blockquote>
            <SplitWords as="p" text={text} className="font-display text-[clamp(2rem,4.6vw,4.2rem)] italic leading-[1.12]" />
          </blockquote>
          <figcaption data-reveal className="kicker mt-10">
            — {author}
          </figcaption>
        </figure>
      </Container>
    </section>
  )
}

export default async function Home({ params }: LocaleParams) {
  const locale = await getLocale(params)
  const { about, news, person, quotes, services, shop, site, contact, faq } = getContent(locale)
  const works = getWorks(locale)
  const t = ui[locale]
  const open = locale === "de" ? "„" : "“"
  const latest = news[0]
  const units = statUnits[locale]
  const stats = [30000, 600, 100]
  const dots = ["#ff5b3a", "#8b7bff", "#3ee6c8", "#f2c66d"]

  return (
    <>
      {/* ───── Hero: Film + 3D + Typografie ───── */}
      <section aria-labelledby="hero-title" className="relative isolate flex min-h-svh items-end overflow-hidden pb-16 pt-32 sm:items-center sm:pb-0">
        <CinemaVideo film={{ base: "/media/hero" }} className="-z-20 opacity-40" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_45%,rgb(139_123_255/0.18),transparent_60%)]" />
        <HeroScene className="-z-10" />
        <Container className="relative">
          <p data-reveal className="kicker mb-8 flex items-center gap-3">
            <span className="h-px w-10 bg-[image:var(--nc-gradient-metal)]" />
            {site.tagline} · Leipzig · Borna
          </p>
          <h1 id="hero-title" className="font-display font-medium leading-[0.86] tracking-[-0.03em]">
            <SplitWords text="Michael" className="block text-[clamp(3.6rem,12vw,11rem)]" />
            <SplitWords text="Fischer-Art" delay={160} className="text-aurora block text-[clamp(3.6rem,12vw,11rem)] italic" />
          </h1>
          <p data-reveal style={{ ["--i" as string]: 4 }} className="mt-8 max-w-md text-lg text-muted sm:text-xl">
            {site.claim}
          </p>
          <div data-reveal style={{ ["--i" as string]: 5 }} className="mt-10 flex flex-wrap gap-3">
            <Magnetic>
              <ButtonLink href="#werk">{t.discover}</ButtonLink>
            </Magnetic>
            <Magnetic>
              <ButtonLink href="#kontakt" variant="ghost">
                {t.request}
              </ButtonLink>
            </Magnetic>
          </div>
        </Container>

        {latest ? (
          <Link
            href={lp(locale, "/aktuelles")}
            className="glass group absolute bottom-8 right-5 hidden max-w-xs animate-[nc-float_7s_ease-in-out_infinite] rounded-[var(--nc-radius-m)] p-5 sm:right-8 md:block"
          >
            <span className="kicker flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              {t.news}
            </span>
            <span className="mt-3 block font-display text-lg italic leading-snug">{latest.title}</span>
            <span className="mt-2 block text-xs text-muted transition-colors group-hover:text-text">{t.more}</span>
          </Link>
        ) : null}

        <a href="#ueber" aria-label={t.scrollCue} className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 sm:flex">
          <span className="kicker text-[0.6rem]">{t.scrollCue}</span>
          <span className="relative h-12 w-px overflow-hidden bg-line">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[nc-scrollcue_2.2s_var(--nc-ease-in-out)_infinite] bg-text" />
          </span>
        </a>
      </section>

      {/* ───── Laufband der Disziplinen ───── */}
      <div aria-hidden="true" className="relative overflow-hidden border-y border-line py-6">
        <div className="flex w-max animate-[nc-marquee_40s_linear_infinite] whitespace-nowrap font-display text-4xl italic text-muted sm:text-6xl">
          {[0, 1].map((k) => (
            <span key={k} className="flex">
              {about.fields.concat(about.fields).map((f, i) => (
                <span key={i} className="flex items-center gap-12 pr-12">
                  {f.title}
                  <span className="text-metal text-3xl not-italic">✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ───── Über ───── */}
      <section id="ueber" aria-labelledby="ueber-titel" className="relative py-28 sm:py-40">
        <Container className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <SectionTitle kicker={t.artistKicker} title={about.title} id="ueber-titel" />
            <p data-reveal className="font-display text-2xl leading-[1.35] text-text/90 sm:text-3xl">
              {about.text}
            </p>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2">
            {about.fields.map((f, i) => (
              <li key={f.title} data-reveal style={{ ["--i" as string]: i % 2 }} className={i % 2 ? "sm:translate-y-16" : ""}>
                <Tilt max={6} className="h-full rounded-[var(--nc-radius-l)]">
                  <article className="glass h-full rounded-[var(--nc-radius-l)] p-7">
                    <p className="font-mono text-[0.7rem] tracking-widest text-dim">{String(i + 1).padStart(2, "0")}</p>
                    <h3 className="mt-10 font-display text-3xl italic">{f.title}</h3>
                    <p className="mt-4 text-[0.95rem] leading-relaxed text-muted">{f.text}</p>
                  </article>
                </Tilt>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Quote {...quotes.bach} open={open} />

      {/* ───── Werk: horizontale Kamerafahrt ───── */}
      <section id="werk" aria-labelledby="werk-titel" className="relative py-24 lg:py-0">
        <Container className="lg:pt-32">
          <SectionTitle kicker={t.work} title={t.workTitle} id="werk-titel" lead={t.worksLead} />
        </Container>
        <HorizontalWorks
          cards={works.map((w) => ({
            href: lp(locale, w.slug === "kunst-am-bau" ? "/kunst-am-bau" : `/werk/${w.slug}`),
            title: w.title,
            count: `${w.images.length} ${t.images}`,
            image: w.cover?.src,
          }))}
        />
      </section>

      {/* ───── Zahlen über Fassaden-Film ───── */}
      <section aria-labelledby="stats-titel" className="relative isolate overflow-hidden py-32 sm:py-44">
        <CinemaVideo film={{ base: "/media/fassaden" }} className="-z-10 opacity-50" />
        <Container>
          <SectionTitle kicker={t.statsKicker} title={t.statsTitle} id="stats-titel" align="center" />
          <dl className="grid gap-5 md:grid-cols-3">
            {stats.map((n, i) => (
              <div key={i} data-reveal="scale" style={{ ["--i" as string]: i }} className="glass flex flex-col-reverse rounded-[var(--nc-radius-l)] p-8 text-center">
                <dt className="kicker mt-5">{t.stats[i][1]}</dt>
                <dd>
                  <span className="block text-sm text-muted">{units.pre[i]}</span>
                  <span className="text-metal font-display text-6xl font-medium sm:text-7xl">
                    <Counter to={n} locale={localeNames[locale].dateLocale} />
                  </span>
                  {units.unit[i] ? <span className="ml-2 font-display text-2xl italic text-muted">{units.unit[i]}</span> : null}
                </dd>
              </div>
            ))}
          </dl>
          <div data-reveal className="mt-12 text-center">
            <ButtonLink href={lp(locale, "/kunst-am-bau")} variant="ghost">
              {t.kunstAmBau}
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* ───── Leistungen + Atelier-Film ───── */}
      <section id="leistungen" aria-labelledby="leistungen-titel" className="relative py-28 sm:py-40">
        <Container>
          <SectionTitle kicker={t.services} title={t.servicesTitle} id="leistungen-titel" lead={services.intro} />
          <div className="grid gap-5 lg:grid-cols-[1fr_1fr_0.85fr]">
            <ul className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
              {services.items.map((s, i) => (
                <li key={s.title} data-reveal style={{ ["--i" as string]: i }}>
                  <Tilt max={5} className="h-full rounded-[var(--nc-radius-l)]">
                    <article className="glass flex h-full flex-col rounded-[var(--nc-radius-l)] p-7">
                      <span className="flex items-center justify-between">
                        <span className="font-mono text-[0.7rem] tracking-widest text-dim">{String(i + 1).padStart(2, "0")}</span>
                        <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: dots[i], boxShadow: `0 0 18px ${dots[i]}` }} />
                      </span>
                      <h3 className="mt-8 font-display text-3xl italic">{s.title}</h3>
                      <p className="mt-4 flex-1 text-[0.95rem] leading-relaxed text-muted">{s.text}</p>
                      <a href={`mailto:${contact.email}?subject=${encodeURIComponent(s.title)}`} className="mt-6 inline-flex items-center gap-2 text-sm text-gold transition-all duration-300 hover:gap-3">
                        {t.requestLabel} <span aria-hidden="true">→</span>
                      </a>
                    </article>
                  </Tilt>
                </li>
              ))}
            </ul>
            <figure data-reveal="scale" className="relative min-h-[28rem] overflow-hidden rounded-[var(--nc-radius-l)] border border-line shadow-[var(--nc-shadow-float)]">
              <AmbientClip className="absolute inset-0 h-full w-full object-cover" src="/media/atelier-loop.mp4" poster="/media/atelier-loop-poster.webp" />
              <span className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 p-7">
                <span className="kicker">{t.studioKicker}</span>
                <span className="mt-3 block font-display text-3xl italic leading-tight">{t.studioTitle}</span>
              </figcaption>
            </figure>
          </div>
        </Container>
      </section>

      {/* ───── Person ───── */}
      <section id="person" aria-labelledby="person-titel" className="relative overflow-hidden py-28 sm:py-40">
        <Container className="grid items-center gap-16 lg:grid-cols-2">
          <div data-reveal="scale" className="relative mx-auto aspect-[4/5] w-full max-w-md">
            <div aria-hidden="true" className="absolute -inset-6 rounded-[2.5rem] bg-[image:var(--nc-gradient-metal)] opacity-40 blur-2xl" />
            <div aria-hidden="true" className="absolute -inset-px rounded-[2rem] bg-[image:var(--nc-gradient-metal)]" />
            <div className="relative h-full overflow-hidden rounded-[2rem] bg-surface">
              <Image src={person.image} alt="Michael Fischer-Art" fill sizes="(min-width: 1024px) 28rem, 90vw" className="object-cover" />
              <span className="absolute inset-0 bg-gradient-to-t from-bg/70 to-transparent" />
            </div>
          </div>
          <div>
            <SectionTitle kicker={t.person} title={person.claim} id="person-titel" />
            <p data-reveal className="text-lg leading-relaxed text-muted">
              {person.text}
            </p>
            <div data-reveal className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href={lp(locale, "/person")}>{t.morePerson}</ButtonLink>
              <ButtonLink href={lp(locale, "/vita")} variant="ghost">
                {t.vita}
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <Quote {...quotes.twain} open={open} />

      {/* ───── Shop / Preise ───── */}
      <section id="shop" aria-labelledby="shop-titel" className="relative py-28 sm:py-40">
        <Container>
          <SectionTitle kicker={t.shop} title={t.shopTitle} id="shop-titel" lead={shop.intro} />
          <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {shop.items.map((item, i) => (
              <li key={item.image} data-reveal style={{ ["--i" as string]: i }}>
                <Tilt max={6} className="h-full rounded-[var(--nc-radius-l)]">
                  <article className="glass flex h-full flex-col overflow-hidden rounded-[var(--nc-radius-l)]">
                    <div className="relative aspect-[4/3] bg-surface">
                      <Image src={item.image} alt={item.title} fill sizes="(min-width: 1280px) 22vw, (min-width: 768px) 45vw, 90vw" className="object-contain p-5" />
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="font-display text-2xl italic leading-tight">{item.title}</h3>
                      <p className="mt-3 line-clamp-4 flex-1 text-sm leading-relaxed text-muted">{item.text}</p>
                      <p className="text-metal mt-5 font-display text-2xl">{item.price}</p>
                      <a
                        href={`mailto:${contact.email}?subject=${encodeURIComponent(`${t.orderSubject}: ${item.title}`)}&body=${encodeURIComponent(t.orderBody)}`}
                        className="mt-5 inline-flex items-center justify-center rounded-full border border-line px-5 py-2.5 text-sm transition-all duration-500 hover:border-primary hover:bg-primary hover:text-white"
                      >
                        {t.orderByMail}
                      </a>
                    </div>
                  </article>
                </Tilt>
              </li>
            ))}
          </ul>
          <p data-reveal className="mt-8 text-sm text-dim">
            {shop.order}{" "}
            <a href={site.shopUrl} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
              {t.toShop} ↗
            </a>
          </p>
        </Container>
      </section>

      {/* ───── FAQ ───── */}
      <section aria-labelledby="faq-titel" className="relative py-28 sm:py-40">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionTitle kicker={t.faqKicker} title={t.faqTitle} id="faq-titel" />
          <Faq items={faq} />
        </Container>
      </section>

      <ContactSection locale={locale} />
    </>
  )
}
