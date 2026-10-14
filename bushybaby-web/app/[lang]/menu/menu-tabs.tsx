"use client";

import Image from "next/image";
import { useState } from "react";
import { clsx } from "clsx";
import type { Dictionary } from "@/content/dictionaries";
import { kes, MENU, type ListSection, type SpiritsSection } from "@/content/menu";
import type { Locale } from "@/lib/i18n";

type Menu = Dictionary["menu"];

const count = (s: (typeof MENU)[number]) => (s.kind === "list" ? s.items.length : s.groups.reduce((n, g) => n + g.rows.length, 0));

/**
 * Tabs follow the WAI-ARIA tabs pattern (arrow keys move between tabs).
 * All sections stay in the HTML (hidden ones via `hidden`) so every drink is
 * crawlable and readable without JavaScript.
 */
export function MenuTabs({ t, lang }: { t: Menu; lang: Locale }) {
  const [active, setActive] = useState(0);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = MENU.length;
    const next = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : null;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    document.getElementById(`tab-${MENU[next].id}`)?.focus();
  };

  return (
    <>
      <div className="sticky top-[88px] z-40 px-5 md:px-[clamp(20px,5vw,80px)]">
        <div role="tablist" aria-label={t.tabsLabel} className="mx-auto flex w-max max-w-full gap-1.5 overflow-x-auto rounded-full border border-white/10 bg-surface-1/75 p-1.5 backdrop-blur-xl [scrollbar-width:none]">
          {MENU.map((s, i) => (
            <button
              key={s.id}
              id={`tab-${s.id}`}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-controls={`panel-${s.id}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={(e) => onKey(e, i)}
              className={clsx("h-11 shrink-0 whitespace-nowrap rounded-full px-5 text-sm font-medium transition-colors duration-300", i === active ? "bg-moon text-night" : "text-mist hover:text-moon")}
            >
              {s.label[lang]} <span className="ml-1 font-mono text-[11px] opacity-60">{String(count(s)).padStart(2, "0")}</span>
            </button>
          ))}
        </div>
      </div>

      {MENU.map((s, i) => (
        <section key={s.id} id={`panel-${s.id}`} role="tabpanel" aria-labelledby={`tab-${s.id}`} hidden={i !== active} className="px-5 pb-28 pt-16 md:px-[clamp(20px,5vw,80px)]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-start gap-16">
            <div className="min-w-0 flex-[999_1_560px]">
              <div className="flex items-baseline justify-between gap-4 border-b border-white/12 pb-6">
                <h2 className="text-[clamp(30px,3.4vw,40px)] font-semibold tracking-[-0.04em]">{s.label[lang]}</h2>
                <span className="label-mono hidden sm:block">{s.kicker[lang]}</span>
              </div>
              {s.kind === "list" ? <ItemList s={s} t={t} lang={lang} /> : <SpiritsTable s={s} t={t} lang={lang} />}
            </div>
            <aside aria-hidden className="sticky top-44 hidden flex-[1_1_340px] flex-col gap-4 lg:flex">
              <div className="relative h-[520px] overflow-hidden rounded-[32px] border border-white/10">
                <Image src={s.image} alt="" fill sizes="400px" className="object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-transparent to-night/90 p-6"><span className="label-mono text-[11px] text-neutral-300">{s.caption}</span></div>
              </div>
            </aside>
          </div>
        </section>
      ))}
    </>
  );
}

function ItemList({ s, t, lang }: { s: ListSection; t: Menu; lang: Locale }) {
  return (
    <ol>
      {s.items.map((it, n) => (
        <li key={it.id} className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-baseline gap-4 border-b border-white/8 py-6 transition-[background,padding] duration-500 ease-land hover:bg-white/[0.03] hover:pl-3 sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:gap-5">
          <span className="font-mono text-xs text-dim">{String(n + 1).padStart(2, "0")}</span>
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-[clamp(20px,2.2vw,26px)] font-semibold tracking-[-0.03em]">{it.name}</h3>
              {it.tag && <span className="inline-flex h-6 items-center rounded-full border border-amber/40 px-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-amber">{it.tag[lang]}</span>}
            </div>
            {it.notes && <p className="max-w-[520px] text-[15px] leading-relaxed text-mist">{it.notes[lang]}</p>}
          </div>
          <span className="font-mono text-[15px]">{it.price == null ? t.ask : kes(it.price)}</span>
        </li>
      ))}
    </ol>
  );
}

/** Spirits: one table per group — by the shot ("tot") or the whole bottle. */
function SpiritsTable({ s, t, lang }: { s: SpiritsSection; t: Menu; lang: Locale }) {
  const cell = "py-3.5 text-right font-mono text-[14px] tabular-nums";
  return (
    <div className="flex flex-col gap-12 pt-8">
      {s.groups.map((g) => (
        <table key={g.label.en} className="w-full border-collapse">
          <caption className="label-mono pb-3 text-left text-amber">{g.label[lang]}</caption>
          <thead>
            <tr className="border-b border-white/12 text-dim">
              <th scope="col" className="py-2 text-left font-mono text-[11px] font-normal uppercase tracking-[0.08em]">{t.item}</th>
              <th scope="col" className="hidden py-2 text-right font-mono text-[11px] font-normal uppercase tracking-[0.08em] sm:table-cell">{t.size}</th>
              <th scope="col" className="w-[72px] py-2 text-right font-mono text-[11px] font-normal uppercase tracking-[0.08em] sm:w-[96px]">{t.shot}</th>
              <th scope="col" className="w-[84px] py-2 text-right font-mono text-[11px] font-normal uppercase tracking-[0.08em] sm:w-[110px]">{t.bottle}</th>
            </tr>
          </thead>
          <tbody>
            {g.rows.map((r) => (
              <tr key={r.name + r.size} className="border-b border-white/8 transition-colors hover:bg-white/[0.03]">
                <th scope="row" className="py-3.5 pr-3 text-left text-[16px] font-medium tracking-[-0.01em]">
                  {r.name}
                  <span className="ml-2 font-mono text-[11px] text-dim sm:hidden">{r.size}</span>
                </th>
                <td className={clsx(cell, "hidden text-dim sm:table-cell")}>{r.size}</td>
                <td className={cell}>{r.tot == null ? "—" : kes(r.tot)}</td>
                <td className={cell}>{kes(r.bottle)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </div>
  );
}
