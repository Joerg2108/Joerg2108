// Sichtbarer Hinweis, solange Impressum und Datenschutz nicht rechtlich geprüft sind.
// Nach der Prüfung LEGAL_TEXTS_REVIEWED in lib/legal.ts auf true setzen.
import { LEGAL_TEXTS_REVIEWED } from "@/lib/legal"
import type { UI } from "@/lib/i18n"

export function LegalDraftNote({ t }: { t: UI }) {
  return (
    <>
      {t.legalNote ? (
        <p role="note" lang={undefined} className="mb-4 rounded border-2 border-ink bg-white px-4 py-3">
          {t.legalNote}
        </p>
      ) : null}
      {LEGAL_TEXTS_REVIEWED ? null : (
        <p role="note" className="mb-8 rounded border-2 border-ink bg-pop-yellow px-4 py-3 font-semibold">
          {t.draftNote}
        </p>
      )}
    </>
  )
}
