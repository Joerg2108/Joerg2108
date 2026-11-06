import type { Metadata } from "next"
import Image from "next/image"
import { getContent } from "@/lib/content"
import { lp, ui } from "@/lib/i18n"
import { alternates, getLocale, type LocaleParams } from "@/lib/locale-params"
import { ButtonLink, Container, PageHero } from "@/components/page-hero"
import { Tilt } from "@/components/motion"

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params)
  const { person } = getContent(locale)
  return { title: ui[locale].person, description: person.text.slice(0, 160), alternates: alternates(locale, "/person") }
}

export default async function PersonPage({ params }: LocaleParams) {
  const locale = await getLocale(params)
  const { person } = getContent(locale)
  const t = ui[locale]
  return (
    <>
      <PageHero kicker={person.kicker} title={person.title}>
        <p>{person.role}</p>
      </PageHero>
      <Container className="grid items-start gap-16 pb-32 lg:grid-cols-[1fr_1.3fr]">
        <div data-reveal="scale" className="relative">
          <div aria-hidden="true" className="absolute -inset-8 rounded-[2.5rem] bg-[image:var(--nc-gradient-aurora)] opacity-25 blur-3xl" />
          <Tilt max={5} className="rounded-[2rem]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-line shadow-[var(--nc-shadow-float)]">
              <Image src={person.image} alt="Michael Fischer-Art" fill priority sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
              <span className="absolute inset-0 bg-gradient-to-t from-bg/60 to-transparent" />
            </div>
          </Tilt>
        </div>
        <div className="lg:pt-10">
          <h2 data-reveal className="text-metal font-display text-4xl italic sm:text-5xl">
            {t.worldwide}
          </h2>
          <p data-reveal className="mt-8 text-xl leading-relaxed text-muted">
            {person.text}
          </p>
          <div data-reveal className="mt-12">
            <ButtonLink href={lp(locale, "/vita")}>{t.toVita.replace(" →", "")}</ButtonLink>
          </div>
        </div>
      </Container>
    </>
  )
}
