// Sichtbarer Hinweis, solange Impressum und Datenschutz nicht rechtlich geprüft sind.
// Nach der Prüfung LEGAL_TEXTS_REVIEWED in lib/legal.ts auf true setzen.
import { LEGAL_TEXTS_REVIEWED } from "@/lib/legal"
import type { UI } from "@/lib/i18n"

export function LegalDraftNote({ t }: { t: UI }) {
  return (
    <>
      {t.legalNote ? <p role="note" className="glass-soft mb-4 rounded-[var(--nc-radius-m)] px-5 py-4 text-muted">{t.legalNote}</p> : null}
      {LEGAL_TEXTS_REVIEWED ? null : (
        <p role="note" className="mb-8 rounded-[var(--nc-radius-m)] border border-gold/40 bg-gold/10 px-5 py-4 text-gold">
          {t.draftNote}
        </p>
      )}
    </>
  )
}
