// Sichtbarer Hinweis, solange Impressum und Datenschutz nicht rechtlich geprüft sind.
// Nach der Prüfung LEGAL_TEXTS_REVIEWED in lib/legal.ts auf true setzen.
import { LEGAL_TEXTS_REVIEWED } from "@/lib/legal"

export function LegalDraftNote() {
  if (LEGAL_TEXTS_REVIEWED) return null
  return (
    <p role="note" className="mb-8 rounded border-2 border-ink bg-pop-yellow px-4 py-3 font-semibold">
      Entwurf: Dieser Text muss vor der Veröffentlichung vom Seitenbetreiber geprüft und ergänzt werden.
    </p>
  )
}
