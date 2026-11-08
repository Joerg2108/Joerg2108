import type { Metadata } from "next"
import { pageMeta } from "@/lib/seo"
import { getContent } from "@/lib/content"
import { ui } from "@/lib/i18n"
import { getLocale, type LocaleParams } from "@/lib/locale-params"
import { Container, PageHero } from "@/components/page-hero"
import { Gallery } from "@/components/gallery"

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params)
  return pageMeta(locale, "/publikationen")
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
      <Container className="pb-32">
        <h2 data-reveal className="kicker mb-8">
          {publications.publisher}
        </h2>
        <ol className="mb-24 border-t border-line">
          {publications.books.map((b, i) => (
            <li key={b.title} data-reveal style={{ ["--i" as string]: i }} className="group grid grid-cols-[4rem_1fr] gap-6 border-b border-line py-7 sm:grid-cols-[8rem_1fr]">
              <span className="font-mono text-sm text-primary">{b.year}</span>
              <span>
                <span className="block font-display text-2xl italic transition-colors duration-500 group-hover:text-gold sm:text-3xl">{b.title}</span>
                {b.note ? <span className="mt-2 block text-sm text-muted">{b.note}</span> : null}
              </span>
            </li>
          ))}
        </ol>
        <Gallery images={publications.covers} title={t.publications} t={t} />
      </Container>
    </>
  )
}
