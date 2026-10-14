"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { de } from "@/content/dictionaries/de";
import { en } from "@/content/dictionaries/en";
import { hasLocale, href } from "@/lib/i18n";

// not-found.tsx receives no props, so the language comes from the URL segment.
export default function NotFound() {
  const params = useParams<{ lang?: string }>();
  const lang = hasLocale(params?.lang) ? params.lang : "en";
  const t = (lang === "de" ? de : en).notFound;
  const common = (lang === "de" ? de : en).common;

  return (
    <section className="flex min-h-[80svh] flex-col items-center justify-center gap-10 px-5 py-24 text-center">
      <svg role="img" aria-label={t.eyes} viewBox="0 0 320 150" className="h-auto w-[min(320px,80vw)] origin-center animate-blink">
        <defs><radialGradient id="eye" cx="50%" cy="45%" r="55%"><stop offset="0" stopColor="#ffd08a" /><stop offset=".6" stopColor="#ffaa40" /><stop offset="1" stopColor="#9c40ff" /></radialGradient></defs>
        <circle cx="80" cy="75" r="68" fill="url(#eye)" /><circle cx="240" cy="75" r="68" fill="url(#eye)" />
        <ellipse cx="80" cy="75" rx="16" ry="44" fill="#0a0a0a" /><ellipse cx="240" cy="75" rx="16" ry="44" fill="#0a0a0a" />
      </svg>
      <div className="flex flex-col items-center gap-5">
        <span className="label-mono text-mist">{t.kicker}</span>
        <h1 className="display text-[clamp(48px,7vw,104px)] leading-[0.9]">{t.title1}<br />{t.title2}</h1>
        <p className="max-w-md text-lg text-mist">{t.lead}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href={href(lang, "/")} className="inline-flex h-13 items-center rounded-full bg-moon px-6 font-semibold text-night">{t.home}</Link>
        <Link href={href(lang, "/reserve")} className="inline-flex h-13 items-center rounded-full border border-white/20 px-6">{common.reserveTable}</Link>
      </div>
    </section>
  );
}
