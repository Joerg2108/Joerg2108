import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { works, getWork } from "@/lib/works"
import { Container, PageHero } from "@/components/page-hero"
import { Gallery } from "@/components/gallery"
import { contact } from "@/lib/content"

export function generateStaticParams() {
  return works.map((w) => ({ slug: w.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const w = getWork((await params).slug)
  return w ? { title: w.title, description: w.text[0] } : {}
}

export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const w = getWork((await params).slug)
  if (!w) notFound()
  const i = works.findIndex((x) => x.slug === w.slug)
  const next = works[(i + 1) % works.length]
  return (
    <>
      <PageHero kicker="Werk" title={w.title}>
        {w.text.map((t) => (
          <p key={t} className="mb-4">
            {t}
          </p>
        ))}
      </PageHero>
      <Container className="py-16">
        <Gallery images={w.images} title={w.title} />
        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t-2 border-ink pt-8">
          <a href={`mailto:${contact.email}?subject=${encodeURIComponent("Anfrage " + w.title)}`} className="font-bold text-pop-red underline decoration-2 underline-offset-4">
            Anfrage zu {w.title}
          </a>
          <Link href={next.slug === "kunst-am-bau" ? "/kunst-am-bau" : `/werk/${next.slug}`} className="pop-shadow-sm rounded border-2 border-ink bg-pop-yellow px-5 py-2.5 font-bold">
            Weiter: {next.title} →
          </Link>
        </div>
      </Container>
    </>
  )
}
