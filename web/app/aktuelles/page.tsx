import type { Metadata } from "next"
import { news } from "@/lib/content"
import { Container, PageHero } from "@/components/page-hero"

export const metadata: Metadata = { title: "Aktuelles", description: "Neuigkeiten und Termine aus dem Atelier Fischer-Art." }

const fmt = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" })

export default function NewsPage() {
  return (
    <>
      <PageHero kicker="Neuigkeiten" title="Aktuelles" />
      <Container className="space-y-12 py-16">
        {news.map((n) => (
          <article key={n.title} className="pop-shadow grid gap-8 rounded-lg border-2 border-ink bg-white p-6 md:grid-cols-2 md:p-10">
            <div>
              <time dateTime={n.date} className="text-sm font-bold uppercase tracking-widest text-pop-red">
                {fmt.format(new Date(n.date))}
              </time>
              <h2 className="mt-2 font-display text-3xl font-extrabold">{n.title}</h2>
              <p className="mt-4 text-lg">{n.text}</p>
            </div>
            {n.video ? (
              <video controls preload="metadata" playsInline className="w-full rounded border-2 border-ink bg-ink">
                <source src={n.video} type="video/mp4" />
              </video>
            ) : null}
          </article>
        ))}
      </Container>
    </>
  )
}
