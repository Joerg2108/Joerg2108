import type { Metadata } from "next"
import { getContent } from "@/lib/content"
import { ui } from "@/lib/i18n"
import { alternates, getLocale, type LocaleParams } from "@/lib/locale-params"
import { Container, PageHero } from "@/components/page-hero"
import { Gallery } from "@/components/gallery"

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params)
  const { exhibitions } = getContent(locale)
  return { title: ui[locale].exhibitions, description: exhibitions.text.slice(0, 160), alternates: alternates(locale, "/ausstellungen") }
}

export default async function ExhibitionsPage({ params }: LocaleParams) {
  const locale = await getLocale(params)
  const { exhibitions } = getContent(locale)
  const t = ui[locale]
  return (
    <>
      <PageHero kicker={exhibitions.kicker} title={t.exhibitions}>
        <p className="mb-4 font-medium text-ink">{exhibitions.lead}</p>
        <p>{exhibitions.text}</p>
      </PageHero>
      <Container className="grid gap-12 py-16 md:grid-cols-2">
        <div>
          <h2 className="mb-6 font-display text-3xl font-extrabold">{t.date}</h2>
          <ul className="divide-y-2 divide-ink/10">
            {exhibitions.dates.map((d, i) => {
              const [year, ...rest] = d.split(" ")
              return (
                <li key={d + i} className="flex gap-4 py-2">
                  <span className="w-14 shrink-0 font-bold text-pop-red">{year}</span>
                  <span>{rest.join(" ")}</span>
                </li>
              )
            })}
          </ul>
        </div>
        <div>
          <h2 className="mb-6 font-display text-3xl font-extrabold">{t.institution}</h2>
          <ul className="divide-y-2 divide-ink/10">
            {exhibitions.institutions.map((d, i) => (
              <li key={d + i} className="py-2">
                {d}
              </li>
            ))}
          </ul>
        </div>
      </Container>
      <Container className="pb-20">
        <Gallery images={exhibitions.images} title={t.exhibitions} t={t} />
      </Container>
    </>
  )
}
