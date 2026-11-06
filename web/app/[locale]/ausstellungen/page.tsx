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
        <p className="mb-5 font-display text-2xl italic leading-snug text-text">{exhibitions.lead}</p>
        <p>{exhibitions.text}</p>
      </PageHero>
      <Container className="grid gap-6 pb-20 md:grid-cols-2">
        {[
          { title: t.date, rows: exhibitions.dates.map((d) => d.split(" ")).map(([y, ...r]) => [y, r.join(" ")]) },
          { title: t.institution, rows: exhibitions.institutions.map((d) => ["", d]) },
        ].map((col) => (
          <section key={col.title} data-reveal className="glass rounded-[var(--nc-radius-l)] p-7 sm:p-9">
            <h2 className="kicker mb-6">{col.title}</h2>
            <ul className="divide-y divide-line">
              {col.rows.map(([y, txt], i) => (
                <li key={i} className="group flex gap-5 py-3 transition-colors duration-300 hover:text-text">
                  {y ? <span className="w-12 shrink-0 font-mono text-sm text-primary">{y}</span> : null}
                  <span className="text-muted transition-colors duration-300 group-hover:text-text">{txt}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </Container>
      <Container className="pb-32">
        <Gallery images={exhibitions.images} title={t.exhibitions} t={t} />
      </Container>
    </>
  )
}
