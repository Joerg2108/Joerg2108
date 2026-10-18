/**
 * Cookie preferences — client only.
 *
 * The site needs no cookie to work. The only optional one remembers the language
 * chosen with the EN | DE switch. The visitor's decision itself is kept in
 * localStorage (strictly necessary to respect that decision, § 25(2) no. 2 TDDDG).
 */
import { LOCALE_COOKIE, locales } from "./i18n";

export const PREFS_KEY = "bb_cookie_prefs";
export const LANGUAGE_COOKIES = [LOCALE_COOKIE, ...locales.map((l) => `bb_lang_${l}`)];

export interface CookiePrefs {
  language: boolean;
}

const DEFAULTS: CookiePrefs = { language: true };

export function getPrefs(): CookiePrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS; // private mode / storage blocked
  }
}

export function setPrefs(prefs: CookiePrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* storage blocked — the choice simply isn't remembered */
  }
  if (!prefs.language) clearLanguageCookies();
}

export function clearLanguageCookies() {
  for (const name of LANGUAGE_COOKIES) document.cookie = `${name}=; path=/; max-age=0`;
}

/** Removes every cookie and the stored choice — the site behaves like a first visit. */
export function clearAll() {
  clearLanguageCookies();
  try {
    localStorage.removeItem(PREFS_KEY);
  } catch {
    /* ignore */
  }
}
