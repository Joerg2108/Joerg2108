"use client"

import { useState } from "react"
import { getContent } from "@/lib/content"
import { lp, ui, type Locale } from "@/lib/i18n"
import { Container, SectionTitle } from "@/components/page-hero"

// Kein Server nötig: Das Formular öffnet das E-Mail-Programm mit vorausgefüllter Nachricht.
// Dadurch werden keine personenbezogenen Daten auf dem Webserver verarbeitet.
export function ContactSection({ locale }: { locale: Locale }) {
  const { contact, site } = getContent(locale)
  const t = ui[locale]
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const body = `${message}\n\n${name}`
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(subject || t.defaultSubject)}&body=${encodeURIComponent(body)}`
  }

  const field =
    "w-full rounded border-2 border-ink bg-white px-3 py-2 outline-none focus-visible:border-pop-blue focus-visible:ring-2 focus-visible:ring-pop-blue/30"

  return (
    <section id="kontakt" aria-labelledby="kontakt-titel" className="border-t-2 border-ink bg-pop-yellow py-20">
      <Container className="grid gap-12 lg:grid-cols-2">
        <div>
          <SectionTitle kicker={t.contact} title={contact.atelier} id="kontakt-titel" />
          <p className="max-w-md text-lg">{contact.intro}</p>
          <address className="mt-8 space-y-1 not-italic">
            <p className="font-display text-xl font-extrabold uppercase">{contact.place}</p>
            <p>{contact.street}</p>
            <p>{contact.city}</p>
            <p className="pt-3">
              {t.phone}:{" "}
              <a href={contact.phoneHref} className="font-semibold underline decoration-2 underline-offset-4">
                {contact.phone}
              </a>
            </p>
            <p>
              {t.email}:{" "}
              <a href={`mailto:${contact.email}`} className="font-semibold underline decoration-2 underline-offset-4">
                {contact.email}
              </a>
            </p>
            <p>
              {t.vatId}: {contact.vatId}
            </p>
          </address>
          <div className="mt-8 flex gap-3">
            <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="pop-shadow-sm rounded border-2 border-ink bg-white px-4 py-2 font-bold">
              Instagram ↗
            </a>
            <a href={site.facebook} target="_blank" rel="noopener noreferrer" className="pop-shadow-sm rounded border-2 border-ink bg-white px-4 py-2 font-bold">
              Facebook ↗
            </a>
          </div>
        </div>

        <form onSubmit={submit} className="pop-shadow space-y-4 rounded-lg border-2 border-ink bg-paper p-6">
          <h3 className="font-display text-2xl font-extrabold">{t.writeMessage}</h3>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t.yourName}</span>
            <input required className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t.subject}</span>
            <input className={field} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t.subjectPlaceholder} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t.yourMessage}</span>
            <textarea required rows={6} className={field} value={message} onChange={(e) => setMessage(e.target.value)} />
          </label>
          <button type="submit" className="pop-shadow-sm rounded border-2 border-ink bg-pop-red px-6 py-3 font-bold text-white transition hover:-translate-y-0.5">
            {t.send}
          </button>
          <p className="text-xs text-muted">
            {t.formNote}{" "}
            <a href={lp(locale, "/datenschutz")} className="underline">
              {t.privacyPolicy}
            </a>
            .
          </p>
        </form>
      </Container>
    </section>
  )
}
