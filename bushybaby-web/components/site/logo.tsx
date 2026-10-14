import { clsx } from "clsx";

/** "The Eyes" — the only custom brand glyph. Everything else is Lucide-style stroke icons. */
export function EyesMark({ className, blink = false }: { className?: string; blink?: boolean }) {
  return (
    <svg viewBox="0 0 30 18" fill="none" aria-hidden className={clsx("h-[18px] w-[30px]", blink && "origin-center animate-blink", className)}>
      <circle cx="8" cy="9" r="7.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="22" cy="9" r="7.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9.5" cy="8" r="2.6" fill="#ffaa40" />
      <circle cx="23.5" cy="8" r="2.6" fill="#ffaa40" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={clsx("flex items-center gap-2.5 text-[17px] font-bold tracking-[-0.03em]", className)}>
      <EyesMark />
      bushybaby
    </span>
  );
}

export const Icon = {
  Arrow: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={clsx("size-4", p.className)}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
  ),
  ArrowUpRight: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={clsx("size-4", p.className)}><path d="M7 17 17 7" /><path d="M7 7h10v10" /></svg>
  ),
  Check: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden className={clsx("size-4", p.className)}><path d="M20 6 9 17l-5-5" /></svg>
  ),
  WhatsApp: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={clsx("size-[18px]", p.className)}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
  ),
  Spark: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" aria-hidden className={clsx("size-[18px]", p.className)}><path d="M12 2 14.5 9.5 22 12 14.5 14.5 12 22 9.5 14.5 2 12 9.5 9.5Z" fill="currentColor" /></svg>
  ),
  Menu: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden className={clsx("size-[18px]", p.className)}><path d="M4 8h16M4 16h16" /></svg>
  ),
  Close: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden className={clsx("size-[18px]", p.className)}><path d="M18 6 6 18M6 6l12 12" /></svg>
  ),
};
