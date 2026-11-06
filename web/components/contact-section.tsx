"use client"

import { useState } from "react"
import { contact, site } from "@/lib/content"
import { Container, SectionTitle } from "@/components/page-hero"

// Kein Server nötig: Das Formular öffnet das E-Mail-Programm mit vorausgefüllter Nachricht.
// Dadurch werden keine personenbezogenen Daten auf dem Webserver verarbeitet.
export function ContactSection() {
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const body = `${message}\n\n${name}`
    const href = `mailto:${contact.email}?subject=${encodeURIComponent(subject || "Anfrage über fischer-art.de")}&body=${encodeURIComponent(body)}`
    window.location.href = href
  }

  const field =
    "w-full rounded border-2 border-ink bg-white px-3 py-2 outline-none focus-visible:border-pop-blue focus-visible:ring-2 focus-visible:ring-pop-blue/30"

  return (
    <section id="kontakt" aria-labelledby="kontakt-titel" className="border-t-2 border-ink bg-pop-yellow py-20">
      <Container className="grid gap-12 lg:grid-cols-2">
        <div>
          <SectionTitle kicker="Kontakt" title={contact.atelier} id="kontakt-titel" />
          <p className="max-w-md text-lg">{contact.intro}</p>
          <address className="mt-8 space-y-1 not-italic">
            <p className="font-display text-xl font-extrabold uppercase">{contact.place}</p>
            <p>{contact.street}</p>
            <p>{contact.city}</p>
            <p className="pt-3">
              Telefon:{" "}
              <a href={contact.phoneHref} className="font-semibold underline decoration-2 underline-offset-4">
                {contact.phone}
              </a>
            </p>
            <p>
              E-Mail:{" "}
              <a href={`mailto:${contact.email}`} className="font-semibold underline decoration-2 underline-offset-4">
                {contact.email}
              </a>
            </p>
            <p>USt-IdNr.: {contact.vatId}</p>
          </address>
          <div className="mt-8 flex gap-3">
            <a
              href={site.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="pop-shadow-sm rounded border-2 border-ink bg-white px-4 py-2 font-bold"
            >
              Instagram ↗
            </a>
            <a
              href={site.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="pop-shadow-sm rounded border-2 border-ink bg-white px-4 py-2 font-bold"
            >
              Facebook ↗
            </a>
          </div>
        </div>

        <form onSubmit={submit} className="pop-shadow space-y-4 rounded-lg border-2 border-ink bg-paper p-6">
          <h3 className="font-display text-2xl font-extrabold">Nachricht schreiben</h3>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Ihr Name</span>
            <input required className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Betreff</span>
            <input className={field} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="z. B. Auftragsarbeit, Event, Atelierrundgang" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Ihre Nachricht</span>
            <textarea required rows={6} className={field} value={message} onChange={(e) => setMessage(e.target.value)} />
          </label>
          <button type="submit" className="pop-shadow-sm rounded border-2 border-ink bg-pop-red px-6 py-3 font-bold text-white transition hover:-translate-y-0.5">
            E-Mail öffnen und senden
          </button>
          <p className="text-xs text-muted">
            Der Button öffnet Ihr E-Mail-Programm. Es werden keine Daten über diese Website übertragen. Hinweise in der{" "}
            <a href="/datenschutz" className="underline">
              Datenschutzerklärung
            </a>
            .
          </p>
        </form>
      </Container>
    </section>
  )
}
