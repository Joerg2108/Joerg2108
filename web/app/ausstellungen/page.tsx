import type { Metadata } from "next"
import { exhibitions } from "@/lib/content"
import { Container, PageHero } from "@/components/page-hero"
import { Gallery } from "@/components/gallery"

export const metadata: Metadata = { title: "Ausstellungen", description: exhibitions.text.slice(0, 160) }

export default function ExhibitionsPage() {
  return (
    <>
      <PageHero kicker={exhibitions.kicker} title="Ausstellungen">
        <p className="mb-4 font-medium text-ink">{exhibitions.lead}</p>
        <p>{exhibitions.text}</p>
      </PageHero>
      <Container className="grid gap-12 py-16 md:grid-cols-2">
        <div>
          <h2 className="mb-6 font-display text-3xl font-extrabold">Zeitpunkt</h2>
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
          <h2 className="mb-6 font-display text-3xl font-extrabold">Institution</h2>
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
        <Gallery images={exhibitions.images} title="Ausstellungen" />
      </Container>
    </>
  )
}
