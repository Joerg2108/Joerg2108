"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import type { Dictionary } from "@/content/dictionaries";
import { clearAll, getPrefs, setPrefs } from "@/lib/consent";

type T = Dictionary["cookies"];

/**
 * "Cookie settings" link + native <dialog>. No banner: the site sets no cookie
 * without an action by the visitor, so there is nothing to consent to up front.
 */
export function CookieSettings({ t, className }: { t: T; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [language, setLanguage] = useState(true);
  const [note, setNote] = useState("");

  useEffect(() => {
    const d = ref.current;
    const close = () => d?.close();
    // Click on the backdrop closes the dialog.
    const onClick = (e: MouseEvent) => e.target === d && close();
    d?.addEventListener("click", onClick);
    return () => d?.removeEventListener("click", onClick);
  }, []);

  const open = () => {
    setLanguage(getPrefs().language);
    setNote("");
    ref.current?.showModal();
  };
  const save = () => {
    setPrefs({ language });
    setNote(t.saved);
  };
  const wipe = () => {
    clearAll();
    setLanguage(true);
    setNote(t.deleted);
  };

  return (
    <>
      <button type="button" onClick={open} className={clsx("text-left", className)}>{t.open}</button>
      <dialog
        ref={ref}
        aria-labelledby="cookie-h"
        className="m-auto max-h-[min(90svh,860px)] w-[min(560px,calc(100vw-32px))] flex-col overflow-hidden rounded-[28px] border border-white/12 bg-surface-1 p-0 text-moon open:flex backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-[clamp(20px,4vw,36px)]">
          <div className="flex items-start justify-between gap-4">
            <h2 id="cookie-h" className="text-[28px] font-semibold tracking-[-0.03em]">{t.title}</h2>
            <button type="button" onClick={() => ref.current?.close()} aria-label={t.close} className="grid size-10 shrink-0 place-items-center rounded-full border border-white/15 text-xl hover:border-white/35">×</button>
          </div>
          <p className="text-[15px] leading-relaxed text-mist">{t.lead}</p>

          <ul className="flex flex-col divide-y divide-white/8 rounded-2xl border border-white/10">
            <Row title={t.necessary.title} body={t.necessary.body} status={t.alwaysOn} />
            <li className="flex items-start justify-between gap-4 p-5">
              <div className="flex flex-col gap-1.5">
                <span id="ck-lang" className="font-medium">{t.language.title}</span>
                <span className="text-sm leading-relaxed text-mist">{t.language.body}</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={language}
                aria-labelledby="ck-lang"
                onClick={() => setLanguage((v) => !v)}
                className={clsx("relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors", language ? "bg-amber" : "bg-white/20")}
              >
                <span aria-hidden className={clsx("absolute top-1 size-5 rounded-full bg-night transition-[left]", language ? "left-6" : "left-1")} />
              </button>
            </li>
            <Row title={t.stats.title} body={t.stats.body} status={t.notUsed} muted />
            <Row title={t.marketing.title} body={t.marketing.body} status={t.notUsed} muted />
          </ul>

        </div>
        {/* Actions stay visible while the list scrolls. */}
        <div className="flex flex-col gap-3 border-t border-white/10 px-[clamp(20px,4vw,36px)] py-5">
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={save} className="inline-flex h-12 items-center rounded-full bg-moon px-6 font-semibold text-night">{t.save}</button>
            <button type="button" onClick={wipe} className="inline-flex h-12 items-center rounded-full border border-white/15 px-6 font-medium hover:border-white/35">{t.deleteAll}</button>
          </div>
          <p aria-live="polite" className="min-h-5 text-sm text-amber">{note}</p>
        </div>
      </dialog>
    </>
  );
}

function Row({ title, body, status, muted }: { title: string; body: string; status: string; muted?: boolean }) {
  return (
    <li className="flex items-start justify-between gap-4 p-5">
      <div className="flex flex-col gap-1.5">
        <span className={clsx("font-medium", muted && "text-mist")}>{title}</span>
        <span className="text-sm leading-relaxed text-mist">{body}</span>
      </div>
      <span className="mt-0.5 shrink-0 rounded-full border border-white/12 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-mist">{status}</span>
    </li>
  );
}
