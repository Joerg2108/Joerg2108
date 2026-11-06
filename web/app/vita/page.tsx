import type { Metadata } from "next"
import { vita } from "@/lib/content"
import { Container, PageHero } from "@/components/page-hero"

export const metadata: Metadata = { title: "Vita", description: "Lebenslauf von Michael Fischer-Art, geboren 1969 in Leipzig." }

export default function VitaPage() {
  return (
    <>
      <PageHero kicker="Lebenslauf" title="Vita" />
      <Container className="py-16">
        <ol className="relative max-w-3xl border-l-4 border-ink">
          {vita.map((v, i) => (
            <li key={v.year + v.text} className="relative mb-8 pl-8">
              <span className={`absolute -left-[13px] top-1.5 h-5 w-5 rounded-full border-2 border-ink ${["bg-pop-red", "bg-pop-yellow", "bg-pop-blue", "bg-pop-green"][i % 4]}`} />
              <p className="font-display text-xl font-extrabold">{v.year}</p>
              <p className="text-lg">{v.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </>
  )
}
