import type { Metadata } from "next"
import { getContent } from "@/lib/content"
import { ui } from "@/lib/i18n"
import { alternates, getLocale, type LocaleParams } from "@/lib/locale-params"
import { Container, PageHero } from "@/components/page-hero"
import { Gallery } from "@/components/gallery"

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params)
  const { publications } = getContent(locale)
  return { title: ui[locale].publications, description: publications.text.slice(0, 160), alternates: alternates(locale, "/publikationen") }
}

export default async function PublicationsPage({ params }: LocaleParams) {
  const locale = await getLocale(params)
  const { publications } = getContent(locale)
  const t = ui[locale]
  return (
    <>
      <PageHero kicker={publications.kicker} title={t.books}>
        <p>{publications.text}</p>
      </PageHero>
      <Container className="py-16">
        <h2 className="mb-6 font-display text-3xl font-extrabold">{publications.publisher}</h2>
        <ul className="mb-16 max-w-3xl divide-y-2 divide-ink/10">
          {publications.books.map((b) => (
            <li key={b.title} className="flex gap-6 py-3">
              <span className="w-14 shrink-0 font-bold text-pop-red">{b.year}</span>
              <span>
                <span className="font-semibold">{b.title}</span>
                {b.note ? <span className="block text-sm text-muted">{b.note}</span> : null}
              </span>
            </li>
          ))}
        </ul>
        <Gallery images={publications.covers} title={t.publications} t={t} />
      </Container>
    </>
  )
}
