import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, hasLocale, localeFromPath, negotiateLocale } from "@/lib/i18n";

/**
 * Sends every URL without a language prefix to /en/… or /de/….
 * Priority: 1) cookie from the language switcher, 2) browser Accept-Language, 3) English.
 * (Next.js 16 renamed middleware.ts → proxy.ts.)
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (localeFromPath(pathname)) return NextResponse.next();

  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const lang = hasLocale(cookie) ? cookie : negotiateLocale(request.headers.get("accept-language"));

  const url = request.nextUrl.clone();
  url.pathname = `/${lang}${pathname === "/" ? "" : pathname}`;
  // 307 (temporary): the target depends on the visitor, so search engines must not cache it as permanent.
  const res = NextResponse.redirect(url, 307);
  res.headers.set("Vary", "Accept-Language, Cookie");
  return res;
}

export const config = {
  // Skip Next internals, API routes and every file with an extension (images, icon.svg, robots.txt, sitemap.xml …).
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
