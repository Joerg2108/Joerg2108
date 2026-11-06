import type { Metadata } from "next"
import { getContent } from "@/lib/content"
import { getWork } from "@/lib/works"
import { ui } from "@/lib/i18n"
import { alternates, getLocale, type LocaleParams } from "@/lib/locale-params"
import { Container, PageHero } from "@/components/page-hero"
import { Gallery } from "@/components/gallery"

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params)
  const { kunstAmBau } = getContent(locale)
  return { title: ui[locale].kunstAmBau, description: kunstAmBau.lead, alternates: alternates(locale, "/kunst-am-bau") }
}

export default async function KunstAmBauPage({ params }: LocaleParams) {
  const locale = await getLocale(params)
  const { kunstAmBau } = getContent(locale)
  const work = getWork(locale, "kunst-am-bau")
  const t = ui[locale]
  return (
    <>
      <PageHero kicker={kunstAmBau.kicker} title={t.kunstAmBau}>
        <p className="mb-4 font-medium text-ink">{kunstAmBau.lead}</p>
        {work?.text.map((p) => (
          <p key={p} className="mb-4">
            {p}
          </p>
        ))}
      </PageHero>
      <Container className="py-16">
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {t.stats.map(([n, l], i) => (
            <div key={l} className={`pop-shadow rounded-lg border-2 border-ink p-6 ${["bg-pop-red text-white", "bg-pop-yellow", "bg-pop-blue text-white"][i]}`}>
              <p className="font-display text-3xl font-extrabold">{n}</p>
              <p className="font-semibold">{l}</p>
            </div>
          ))}
        </div>
        <h2 className="mb-6 font-display text-3xl font-extrabold">{t.references}</h2>
        <div className="overflow-x-auto rounded-lg border-2 border-ink">
          <table className="w-full min-w-[32rem] text-left">
            <thead className="bg-ink text-paper">
              <tr>
                <th className="px-4 py-3">{t.year}</th>
                <th className="px-4 py-3">{t.place}</th>
                <th className="px-4 py-3">{t.object}</th>
              </tr>
            </thead>
            <tbody>
              {kunstAmBau.projects.map((p, i) => (
                <tr key={i} className="border-t border-ink/15 odd:bg-white">
                  <td className="px-4 py-2 font-bold text-pop-red">{p.year}</td>
                  <td className="px-4 py-2">{p.place}</td>
                  <td className="px-4 py-2">{p.object}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2 className="mb-6 mt-16 font-display text-3xl font-extrabold">{t.projects}</h2>
        <Gallery images={work?.images ?? []} title={t.kunstAmBau} t={t} />
      </Container>
    </>
  )
}
