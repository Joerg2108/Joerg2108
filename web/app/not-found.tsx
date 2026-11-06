import Link from "next/link"
import { PageHero } from "@/components/page-hero"

export default function NotFound() {
  return (
    <PageHero kicker="Fehler 404" title="Diese Seite gibt es nicht.">
      <p>
        Vielleicht hilft der Weg zurück zur{" "}
        <Link href="/" className="font-bold text-pop-red underline">
          Startseite
        </Link>
        .
      </p>
    </PageHero>
  )
}
