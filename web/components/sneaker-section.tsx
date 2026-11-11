// Startseite: „Kunst trifft Sneaker“ – Flyer, Produktmerkmale, Preis, zwei Filme.
// Videos laden erst beim Abspielen (preload="none"), davor steht ein lokales Standbild.
import Image from "next/image"
import { getContent } from "@/lib/content"
import type { Locale } from "@/lib/i18n"
import { sneaker } from "@/lib/sneaker"
import { waLink } from "@/lib/whatsapp"
import { ButtonLink, Container, SectionTitle } from "@/components/page-hero"

const IMG = "/images/sneaker"

export function SneakerSection({ locale }: { locale: Locale }) {
  const s = sneaker[locale]
  const { contact, site } = getContent(locale)
  return (
    <section id="sneaker" aria-labelledby="sneaker-titel" className="relative isolate overflow-hidden py-28 sm:py-40">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="nc-orb right-[-8%] top-[8%] h-[34rem] w-[34rem] bg-primary/25" />
        <div className="nc-orb bottom-[-10%] left-[-6%] h-[28rem] w-[28rem] bg-accent/15 [animation-delay:-8s]" />
      </div>
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <a
            data-reveal="scale"
            href={`${IMG}/sneaker-flyer.webp`}
            target="_blank"
            rel="noopener"
            aria-label={s.flyerOpen}
            className="group relative mx-auto block w-full max-w-md"
          >
            <span aria-hidden="true" className="absolute -inset-6 rounded-[2.5rem] bg-[image:var(--nc-gradient-aurora)] opacity-30 blur-2xl" />
            <span className="relative block overflow-hidden rounded-[1.75rem] border border-line shadow-[var(--nc-shadow-float)]">
              <Image
                src={`${IMG}/sneaker-flyer.webp`}
                alt={s.flyerAlt}
                width={1024}
                height={1536}
                sizes="(min-width: 1024px) 28rem, 92vw"
                className="h-auto w-full transition duration-700 ease-[var(--nc-ease-out)] group-hover:scale-[1.03]"
              />
            </span>
          </a>

          <div>
            <SectionTitle kicker={s.kicker} title={s.title} id="sneaker-titel" lead={s.lead} />
            <dl data-reveal className="mt-10 grid gap-x-10 gap-y-7 sm:grid-cols-2">
              {s.features.map(([name, text]) => (
                <div key={name} className="border-t border-line pt-5">
                  <dt className="font-display text-xl italic text-text">{name}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted">{text}</dd>
                </div>
              ))}
            </dl>
            <div data-reveal className="mt-12 flex flex-wrap items-end gap-x-8 gap-y-6">
              <p>
                <span className="text-aurora block font-display text-6xl font-medium leading-none sm:text-7xl">{s.price}</span>
                <span className="kicker mt-3 block">{s.priceNote}</span>
              </p>
              <p className="max-w-[16rem] font-display text-xl italic leading-snug text-muted">{s.claim}</p>
            </div>
            <div data-reveal className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href={`mailto:${contact.email}?subject=${encodeURIComponent(s.askSubject)}`}>{s.ask}</ButtonLink>
              <ButtonLink href={waLink(site.whatsapp, s.whatsappText)} variant="ghost" external>
                {s.whatsapp}
              </ButtonLink>
            </div>
          </div>
        </div>

        <ul className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.62fr]">
          {s.videos.map((label, i) => (
            <li key={label} data-reveal style={{ ["--i" as string]: i }}>
              <figure>
                <video
                  controls
                  playsInline
                  preload="none"
                  poster={`${IMG}/sneaker-poster-${i + 1}.webp`}
                  aria-label={label}
                  className="aspect-[10/7] w-full rounded-[1.5rem] border border-line bg-surface object-cover shadow-[var(--nc-shadow-float)]"
                >
                  <source src={`/media/sneaker/sneaker-${i + 1}.mp4`} type="video/mp4" />
                </video>
                <figcaption className="kicker mt-4">{label}</figcaption>
              </figure>
            </li>
          ))}
          <li data-reveal style={{ ["--i" as string]: 2 }} className="hidden lg:block">
            <div className="relative aspect-[10/11.3] overflow-hidden rounded-[1.5rem] border border-line shadow-[var(--nc-shadow-float)]">
              <Image src={`${IMG}/sneaker-marker.webp`} alt={s.markerAlt} fill sizes="20vw" className="object-cover" />
            </div>
          </li>
        </ul>
      </Container>
    </section>
  )
}
