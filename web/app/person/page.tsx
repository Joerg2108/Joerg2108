import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { person } from "@/lib/content"
import { Container, PageHero } from "@/components/page-hero"

export const metadata: Metadata = { title: "Person", description: person.text.slice(0, 160) }

export default function PersonPage() {
  return (
    <>
      <PageHero kicker={person.kicker} title={person.title}>
        <p>{person.role}</p>
      </PageHero>
      <Container className="grid items-start gap-12 py-16 lg:grid-cols-[1fr_1.4fr]">
        <div className="pop-shadow relative aspect-[4/5] overflow-hidden rounded-lg border-2 border-ink bg-pop-yellow">
          <Image src={person.image} alt="Michael Fischer-Art" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
        </div>
        <div>
          <h2 className="font-display text-3xl font-extrabold">Weltweit erfolgreich</h2>
          <p className="mt-4 text-lg leading-relaxed">{person.text}</p>
          <Link href="/vita" className="pop-shadow-sm mt-8 inline-block rounded border-2 border-ink bg-pop-red px-5 py-2.5 font-bold text-white">
            Zur Vita →
          </Link>
        </div>
      </Container>
    </>
  )
}
