"use client"

import { useState } from "react"
import { getContent } from "@/lib/content"
import { lp, ui, type Locale } from "@/lib/i18n"
import { Container } from "@/components/page-hero"
import { Magnetic, SplitWords } from "@/components/motion"

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

  return (
    <section id="kontakt" aria-labelledby="kontakt-titel" className="relative isolate overflow-hidden py-28 sm:py-40">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="nc-orb left-[5%] top-[10%] h-[30rem] w-[30rem] bg-primary/25" />
        <div className="nc-orb bottom-[0%] right-[5%] h-[34rem] w-[34rem] bg-secondary/25 [animation-delay:-9s]" />
      </div>
      <Container className="grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <div>
          <p data-reveal className="kicker mb-6 flex items-center gap-3">
            <span className="h-px w-8 bg-[image:var(--nc-gradient-metal)]" />
            {t.contact} · {contact.atelier}
          </p>
          <SplitWords as="h2" id="kontakt-titel" text={t.contactTitle} className="font-display text-[clamp(2.6rem,6vw,5.4rem)] font-medium leading-[0.95]" />
          <p data-reveal className="mt-8 max-w-md text-lg text-muted">{contact.intro}</p>
          <dl data-reveal className="mt-12 grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="kicker">{contact.place}</dt>
              <dd className="mt-2 leading-relaxed">
                {contact.street}
                <br />
                {contact.city}
              </dd>
            </div>
            <div>
              <dt className="kicker">{t.email}</dt>
              <dd className="mt-2">
                <a href={`mailto:${contact.email}`} className="bg-[image:linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-500 hover:bg-[length:100%_1px]">
                  {contact.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="kicker">{t.phone}</dt>
              <dd className="mt-2">
                <a href={contact.phoneHref} className="hover:text-gold">
                  {contact.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="kicker">{t.vatId}</dt>
              <dd className="mt-2 text-muted">{contact.vatId}</dd>
            </div>
          </dl>
          <div data-reveal className="mt-10 flex gap-3">
            {[
              ["Instagram", site.instagram],
              ["Facebook", site.facebook],
            ].map(([l, h]) => (
              <Magnetic key={l}>
                <a href={h} target="_blank" rel="noopener noreferrer" className="glass-soft inline-block rounded-full px-5 py-2.5 text-sm transition-colors hover:border-white/30">
                  {l} ↗
                </a>
              </Magnetic>
            ))}
          </div>
        </div>

        <form data-reveal="scale" onSubmit={submit} className="glass space-y-6 rounded-[var(--nc-radius-l)] p-7 sm:p-10">
          <h3 className="font-display text-3xl italic">{t.writeMessage}</h3>
          {[
            { label: t.yourName, value: name, set: setName, auto: "name", required: true },
            { label: t.subject, value: subject, set: setSubject, placeholder: t.subjectPlaceholder },
          ].map((f) => (
            <label key={f.label} className="group block">
              <span className="kicker">{f.label}</span>
              <input
                required={f.required}
                autoComplete={f.auto}
                placeholder={f.placeholder}
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                className="mt-2 w-full border-b border-line bg-transparent py-3 text-lg outline-none transition-colors duration-300 placeholder:text-dim focus:border-primary"
              />
            </label>
          ))}
          <label className="block">
            <span className="kicker">{t.yourMessage}</span>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-2 w-full resize-none border-b border-line bg-transparent py-3 text-lg outline-none transition-colors duration-300 focus:border-primary"
            />
          </label>
          <button
            type="submit"
            className="group relative w-full overflow-hidden rounded-full bg-text px-7 py-4 text-sm font-semibold text-bg transition-shadow duration-500 hover:shadow-[var(--nc-shadow-glow)]"
          >
            <span className="absolute inset-0 translate-y-full bg-[image:var(--nc-gradient-aurora)] transition-transform duration-500 ease-[var(--nc-ease-out)] group-hover:translate-y-0" />
            <span className="relative group-hover:text-white">{t.send} →</span>
          </button>
          <p className="text-xs leading-relaxed text-dim">
            {t.formNote}{" "}
            <a href={lp(locale, "/datenschutz")} className="underline hover:text-text">
              {t.privacyPolicy}
            </a>
            .
          </p>
        </form>
      </Container>
    </section>
  )
}
