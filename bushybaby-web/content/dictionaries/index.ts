import type { Locale } from "@/lib/i18n";
import { de } from "./de";
import { en, type Dictionary } from "./en";

// Both dictionaries are small; importing them statically keeps it simple and
// lets client components receive only the slice they need as props.
const dictionaries: Record<Locale, Dictionary> = { en, de };

export function getDictionary(lang: Locale): Dictionary {
  return dictionaries[lang];
}

export type { Dictionary };
