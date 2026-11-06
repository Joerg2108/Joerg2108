import Image from "next/image"
import Link from "next/link"
import { getContent } from "@/lib/content"
import { getWorks } from "@/lib/works"
import { lp, ui } from "@/lib/i18n"
import { getLocale, alternates, type LocaleParams } from "@/lib/locale-params"
import { Container, SectionTitle } from "@/components/page-hero"
import { ContactSection } from "@/components/contact-section"

const accents = ["bg-pop-red text-white", "bg-pop-yellow", "bg-pop-blue text-white", "bg-pop-green text-white", "bg-pop-pink text-white", "bg-white"]

export async function generateMetadata({ params }: LocaleParams) {
  return { alternates: alternates(await getLocale(params), "/") }
}

function Quote({ text, author, open, close }: { text: string; author: string; open: string; close: string }) {
  return (
    <section className="border-y-2 border-ink bg-ink py-20 text-paper">
      <Container>
        <blockquote className="mx-auto max-w-4xl text-center">
          <p className="font-display text-3xl font-extrabold leading-tight sm:text-5xl">
            {open}
            {text}
            {close}
          </p>
          <footer className="mt-6 text-sm font-bold uppercase tracking-widest text-pop-yellow">{author}</footer>
        </blockquote>
      </Container>
    </section>
  )
}

export default async function Home({ params }: LocaleParams) {
  const locale = await getLocale(params)
  const { about, news, person, quotes, services, shop, site, contact } = getContent(locale)
  const works = getWorks(locale)
  const t = ui[locale]
  const q = locale === "de" ? ["„", "“"] : ["“", "”"]
  const latest = news[0]
  return (
    <>
      <section className="relative overflow-hidden border-b-2 border-ink">
        <div className="absolute inset-0">
          <Image src="/images/werk/originale/originale-02.webp" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/55 to-ink/10" />
        </div>
        <Container className="relative py-24 text-paper sm:py-36">
          <p className="mb-6 inline-block -rotate-2 border-2 border-ink bg-pop-yellow px-3 py-1 text-sm font-bold uppercase tracking-widest text-ink">{site.tagline}</p>
          <h1 className="font-display text-6xl font-extrabold leading-[0.9] tracking-tight sm:text-8xl lg:text-9xl">
            Michael
            <br />
            <span className="text-pop-yellow">Fischer-Art</span>
          </h1>
          <p className="mt-6 max-w-xl text-xl font-medium sm:text-2xl">{site.claim}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="#werk" className="pop-shadow-sm rounded border-2 border-ink bg-pop-red px-6 py-3 font-bold text-white transition hover:-translate-y-0.5">
              {t.discover}
            </Link>
            <Link href="#kontakt" className="pop-shadow-sm rounded border-2 border-ink bg-paper px-6 py-3 font-bold text-ink transition hover:-translate-y-0.5">
              {t.request}
            </Link>
          </div>
        </Container>
      </section>

      {latest ? (
        <section aria-label={t.news} className="border-b-2 border-ink bg-pop-red text-white">
          <Container className="flex flex-col items-start gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold">
              <span className="mr-3 rounded bg-white px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-pop-red">{t.news}</span>
              {latest.title}
            </p>
            <Link href={lp(locale, "/aktuelles")} className="font-bold underline decoration-2 underline-offset-4">
              {t.more}
            </Link>
          </Container>
        </section>
      ) : null}

      <section id="ueber" className="py-20 sm:py-28">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
            <SectionTitle kicker={t.artistKicker} title={about.title} />
            <p className="text-xl leading-relaxed sm:text-2xl">{about.text}</p>
          </div>
          <ul className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {about.fields.map((f, i) => (
              <li key={f.title} className={`pop-shadow rounded-lg border-2 border-ink p-6 ${accents[i % accents.length]}`}>
                <h3 className="font-display text-2xl font-extrabold">{f.title}</h3>
                <p className="mt-3 leading-relaxed opacity-95">{f.text}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Quote {...quotes.bach} open={q[0]} close={q[1]} />

      <section id="werk" className="py-20 sm:py-28">
        <Container>
          <SectionTitle kicker={t.work} title={t.workTitle} />
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {works.map((w) => {
              const cover = w.images[0]
              const href = lp(locale, w.slug === "kunst-am-bau" ? "/kunst-am-bau" : `/werk/${w.slug}`)
              return (
                <li key={w.slug}>
                  <Link href={href} className="group block overflow-hidden rounded-lg border-2 border-ink bg-white transition hover:-translate-y-1 hover:pop-shadow">
                    <div className="relative aspect-[4/3] overflow-hidden bg-pop-yellow">
                      {cover ? (
                        <Image src={cover.src} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between border-t-2 border-ink px-4 py-3">
                      <h3 className="font-display text-xl font-extrabold">{w.title}</h3>
                      <span className="text-sm font-semibold text-muted">
                        {w.images.length} {t.images} →
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Container>
      </section>

      <section id="leistungen" className="halftone border-y-2 border-ink py-20 sm:py-28">
        <Container>
          <SectionTitle kicker={t.services} title={t.servicesTitle} />
          <p className="-mt-4 mb-12 max-w-2xl text-xl">{services.intro}</p>
          <ul className="grid gap-6 md:grid-cols-2">
            {services.items.map((s, i) => (
              <li key={s.title} className="pop-shadow rounded-lg border-2 border-ink bg-paper p-8">
                <span className={`mb-4 inline-block rounded border-2 border-ink px-2 py-0.5 text-xs font-bold ${accents[i]}`}>0{i + 1}</span>
                <h3 className="font-display text-3xl font-extrabold">{s.title}</h3>
                <p className="mt-3 leading-relaxed">{s.text}</p>
                <a href={`mailto:${contact.email}?subject=${encodeURIComponent(s.title)}`} className="mt-5 inline-block font-bold text-pop-red underline decoration-2 underline-offset-4">
                  {t.requestLabel}: {contact.email}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {["/images/home/services-1.webp", "/images/home/services-2.webp"].map((src) => (
              <div key={src} className="relative aspect-[3/2] overflow-hidden rounded-lg border-2 border-ink">
                <Image src={src} alt={t.atelierImages} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section id="person" className="py-20 sm:py-28">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <div className="pop-shadow relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-full border-4 border-ink bg-pop-yellow">
            <Image src={person.image} alt="Michael Fischer-Art" fill sizes="(min-width: 1024px) 28rem, 90vw" className="object-cover" />
          </div>
          <div>
            <SectionTitle kicker={t.person} title={person.claim} />
            <p className="text-lg leading-relaxed">{person.text}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href={lp(locale, "/person")} className="pop-shadow-sm rounded border-2 border-ink bg-pop-blue px-5 py-2.5 font-bold text-white">
                {t.morePerson}
              </Link>
              <Link href={lp(locale, "/vita")} className="pop-shadow-sm rounded border-2 border-ink bg-white px-5 py-2.5 font-bold">
                {t.vita}
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Quote {...quotes.twain} open={q[0]} close={q[1]} />

      <section id="shop" className="py-20 sm:py-28">
        <Container>
          <SectionTitle kicker={t.shop} title={t.shopTitle} />
          <p className="-mt-4 mb-4 max-w-2xl text-xl">{shop.intro}</p>
          <p className="mb-12 max-w-2xl text-muted">
            {t.toShop}:{" "}
            <a href={site.shopUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-pop-red underline">
              fischer-art-shop.de
            </a>
          </p>
          <ul className="grid gap-6 md:grid-cols-2">
            {shop.items.map((item) => (
              <li key={item.image} className="overflow-hidden rounded-lg border-2 border-ink bg-white">
                <div className="relative aspect-[3/2] border-b-2 border-ink bg-paper">
                  <Image src={item.image} alt={item.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-contain p-4" />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-2xl font-extrabold">{item.title}</h3>
                  <p className="mt-2 leading-relaxed">{item.text}</p>
                  <p className="mt-4 font-bold">{item.price}</p>
                  <a
                    href={`mailto:${contact.email}?subject=${encodeURIComponent(`${t.orderSubject}: ${item.title}`)}&body=${encodeURIComponent(t.orderBody)}`}
                    className="pop-shadow-sm mt-4 inline-block rounded border-2 border-ink bg-pop-red px-5 py-2 font-bold text-white"
                  >
                    {t.orderByMail}
                  </a>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted">{shop.order}</p>
        </Container>
      </section>

      <ContactSection locale={locale} />
    </>
  )
}
