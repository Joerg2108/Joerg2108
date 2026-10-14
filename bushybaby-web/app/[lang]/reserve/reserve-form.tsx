"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { BorderBeam } from "@/components/magicui";
import { Icon } from "@/components/site/logo";
import type { Dictionary } from "@/content/dictionaries";
import { href, type Locale } from "@/lib/i18n";
import { site } from "@/lib/site";
import { buildReservationMessage, formatDay, validateReservation, whatsappUrl, type ReservationRequest, type ValidationErrors } from "@/lib/whatsapp";

type Props = { lang: Locale; t: Pick<Dictionary["reserve"], "form" | "errors"> };

/** Local "today" as ISO date, plus the next N days — built in the browser so the guest's date is used. */
function nextDays(n: number, lang: Locale, tonight: string) {
  const out: { iso: string; dow: string; day: string }[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    out.push({ iso, dow: i === 0 ? tonight : formatDay(iso, lang).split(" ")[0], day: String(d.getDate()) });
  }
  return out;
}

const chip = (on: boolean) =>
  clsx("border transition-colors duration-200", on ? "border-moon bg-moon text-night" : "border-white/12 bg-night text-moon hover:border-white/35");

export function ReserveForm({ lang, t }: Props) {
  const f = t.form;
  const router = useRouter();
  // Days depend on the guest's clock, so they're computed after mount — the page itself is
  // prerendered at build time and must not bake in that day's date (hydration mismatch + stale days).
  const [days, setDays] = useState<ReturnType<typeof nextDays>>([]);
  const [form, setForm] = useState<ReservationRequest>({ date: "", time: site.reservation.slots[2], guests: 2, name: "", phone: "", note: "" });
  const [errors, setErrors] = useState<ValidationErrors>({});
  useEffect(() => {
    const d = nextDays(site.reservation.daysAhead, lang, f.tonight);
    setDays(d);
    setForm((x) => (x.date ? x : { ...x, date: d[0].iso }));
  }, [lang, f.tonight]);
  const set = <K extends keyof ReservationRequest>(k: K, v: ReservationRequest[K]) => setForm((x) => ({ ...x, [k]: v }));
  const err = (k: keyof ReservationRequest) => (errors[k] ? t.errors[errors[k]!] : undefined);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateReservation(form, site.reservation.maxGuests);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(`f-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    // Open WhatsApp in a new tab (desktop: WhatsApp Web; mobile: the app), then show the confirmation page.
    window.open(whatsappUrl(site.whatsapp, buildReservationMessage(form, lang)), "_blank", "noopener");
    const q = new URLSearchParams({ d: form.date, t: form.time, g: String(form.guests), n: form.name.trim() });
    router.push(`${href(lang, "/reserve/thanks")}?${q}`);
  };

  const guestWord = form.guests === 1 ? f.guest : f.guests;
  const dayLabel = !form.date ? "—" : form.date === days[0]?.iso ? f.tonight : formatDay(form.date, lang);
  const summary = `${dayLabel} · ${form.time} · ${form.guests} ${guestWord}`;

  return (
    <form onSubmit={onSubmit} noValidate aria-label={f.label} className="relative flex flex-col gap-9 overflow-hidden rounded-[32px] border border-white/12 bg-surface-1/80 p-[clamp(24px,4vw,48px)] backdrop-blur-xl">
      <BorderBeam size={160} duration={10} />

      <fieldset className="flex flex-col gap-3.5">
        <legend className="label-mono mb-3.5 text-mist">{f.when}</legend>
        <div id="f-date" tabIndex={-1} role="group" aria-label={f.day} className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {!days.length && Array.from({ length: 7 }, (_, i) => <span key={i} aria-hidden className="h-[72px] min-w-[84px] shrink-0 animate-pulse rounded-2xl border border-white/10 bg-surface-2" />)}
          {days.map((d) => (
            <button key={d.iso} type="button" aria-pressed={form.date === d.iso} onClick={() => set("date", d.iso)} className={clsx("flex h-[72px] min-w-[84px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl", chip(form.date === d.iso))}>
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] opacity-70">{d.dow}</span>
              <span className="text-xl font-semibold">{d.day}</span>
            </button>
          ))}
        </div>
        <div id="f-time" tabIndex={-1} role="group" aria-label={f.time} className="flex flex-wrap gap-2">
          {site.reservation.slots.map((s) => (
            <button key={s} type="button" aria-pressed={form.time === s} onClick={() => set("time", s)} className={clsx("h-11 rounded-full px-[18px] font-mono text-sm", chip(form.time === s))}>{s}</button>
          ))}
        </div>
        {err("date") && <p className="text-sm text-red-400">{err("date")}</p>}
      </fieldset>

      <fieldset className="flex flex-col gap-3.5">
        <legend className="label-mono mb-3.5 text-mist">{f.howMany}</legend>
        <div className="flex h-[72px] items-center justify-between rounded-2xl border border-white/12 bg-night pl-6 pr-3">
          <output id="f-guests" htmlFor="minus plus" aria-live="polite" className="text-lg"><strong className="mr-2 text-[28px] font-semibold tracking-[-0.03em]">{form.guests}</strong>{guestWord}</output>
          <div className="flex gap-2">
            <button id="minus" type="button" aria-label={f.fewer} onClick={() => set("guests", Math.max(1, form.guests - 1))} className="size-12 rounded-full border border-white/15 text-[22px]">−</button>
            <button id="plus" type="button" aria-label={f.more} onClick={() => set("guests", Math.min(site.reservation.maxGuests, form.guests + 1))} className="size-12 rounded-full bg-moon text-[22px] text-night">+</button>
          </div>
        </div>
        {err("guests") && <p className="text-sm text-red-400">{err("guests")}</p>}
      </fieldset>

      <fieldset className="grid gap-3.5 sm:grid-cols-2">
        <legend className="label-mono mb-3.5 text-mist">{f.who}</legend>
        <Field id="f-name" label={f.name} error={err("name")}>
          <input id="f-name" name="name" autoComplete="name" required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={f.namePlaceholder} aria-invalid={!!errors.name} aria-describedby={errors.name ? "f-name-err" : undefined} className={inputCls(!!errors.name)} />
        </Field>
        <Field id="f-phone" label={f.phone} hint={f.optional}>
          <input id="f-phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+254 …" className={inputCls(false)} />
        </Field>
        <Field id="f-note" label={f.note} hint={f.noteHint} error={err("note")} wide>
          <textarea id="f-note" name="note" rows={3} maxLength={500} value={form.note} onChange={(e) => set("note", e.target.value)} className={clsx(inputCls(!!errors.note), "h-auto resize-y py-3.5")} />
        </Field>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
        <span className="text-sm text-mist" aria-live="polite">{summary}</span>
        <button type="submit" className="inline-flex h-14 items-center gap-2.5 rounded-full bg-moon px-7 font-semibold text-night transition-transform hover:-translate-y-px active:translate-y-px">
          <Icon.WhatsApp /> {f.submit}
        </button>
      </div>
      <p className="-mt-4 text-xs leading-relaxed text-dim">{f.fineprint}</p>
    </form>
  );
}

const inputCls = (err: boolean) =>
  clsx("h-[52px] w-full rounded-[14px] border bg-night px-4 text-base text-moon transition-colors focus:border-amber focus:outline-none focus:ring-4 focus:ring-amber/15", err ? "border-red-400" : "border-white/12");

function Field({ id, label, hint, error, wide, children }: { id: string; label: string; hint?: string; error?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={clsx("flex flex-col gap-2", wide && "sm:col-span-2")}>
      <label htmlFor={id} className="text-sm text-neutral-300">{label}{hint && <span className="ml-2 text-[13px] text-dim">{hint}</span>}</label>
      {children}
      {error && <p id={`${id}-err`} className="text-[13px] text-red-400">{error}</p>}
    </div>
  );
}
