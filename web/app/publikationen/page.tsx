import type { Metadata } from "next"
import { publications } from "@/lib/content"
import { Container, PageHero } from "@/components/page-hero"
import { Gallery } from "@/components/gallery"

export const metadata: Metadata = { title: "Publikationen", description: publications.text.slice(0, 160) }

export default function PublicationsPage() {
  return (
    <>
      <PageHero kicker={publications.kicker} title="Bücher">
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
        <Gallery images={publications.covers} title="Publikationen" />
      </Container>
    </>
  )
}
