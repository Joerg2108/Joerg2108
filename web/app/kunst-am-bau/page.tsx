import type { Metadata } from "next"
import { kunstAmBau } from "@/lib/content"
import { getWork } from "@/lib/works"
import { Container, PageHero } from "@/components/page-hero"
import { Gallery } from "@/components/gallery"

export const metadata: Metadata = { title: "Kunst am Bau", description: kunstAmBau.lead }

export default function KunstAmBauPage() {
  const work = getWork("kunst-am-bau")
  return (
    <>
      <PageHero kicker={kunstAmBau.kicker} title="Kunst am Bau">
        <p className="mb-4 font-medium text-ink">{kunstAmBau.lead}</p>
        {work?.text.map((t) => (
          <p key={t} className="mb-4">
            {t}
          </p>
        ))}
      </PageHero>
      <Container className="py-16">
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {[
            ["über 30.000 qm", "Fassadenfläche"],
            ["fast 600 Liter", "bunte Farbe"],
            ["über 100", "Gebäude international gestaltet"],
          ].map(([n, l], i) => (
            <div key={l} className={`pop-shadow rounded-lg border-2 border-ink p-6 ${["bg-pop-red text-white", "bg-pop-yellow", "bg-pop-blue text-white"][i]}`}>
              <p className="font-display text-3xl font-extrabold">{n}</p>
              <p className="font-semibold">{l}</p>
            </div>
          ))}
        </div>
        <h2 className="mb-6 font-display text-3xl font-extrabold">Referenzen</h2>
        <div className="overflow-x-auto rounded-lg border-2 border-ink">
          <table className="w-full min-w-[32rem] text-left">
            <thead className="bg-ink text-paper">
              <tr>
                <th className="px-4 py-3">Jahr</th>
                <th className="px-4 py-3">Ort</th>
                <th className="px-4 py-3">Objekt</th>
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
        <h2 className="mb-6 mt-16 font-display text-3xl font-extrabold">Projekte</h2>
        <Gallery images={work?.images ?? []} title="Kunst am Bau" />
      </Container>
    </>
  )
}
