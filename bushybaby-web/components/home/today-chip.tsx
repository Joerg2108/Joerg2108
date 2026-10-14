"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/content/dictionaries";
import { WEEK_EVENTS } from "@/content/shared";

/**
 * Shows today's weekly event ("Tuesday: Cocktails 2 for 1") or the generic
 * "open from 11:00" line. Uses Nairobi time, so a guest checking from Germany
 * the night before still sees what's on at the bar. Rendered after mount —
 * the page is static, the weekday is not.
 */
export function TodayChip({ t, week }: { t: Dictionary["home"]["hero"]; week: Dictionary["home"]["week"] }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const day = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })).getDay();
    const idx = WEEK_EVENTS[day];
    setText(idx === undefined ? t.everyDay : week.items[idx].title);
  }, [t.everyDay, week.items]);

  return (
    <div className="absolute bottom-[120px] right-0 z-30 flex min-w-[220px] flex-col gap-1 rounded-[18px] border border-white/15 bg-surface-2/55 px-[18px] py-3.5 backdrop-blur-xl">
      <span className="label-mono text-[11px] text-mist">{t.today}</span>
      <span className="min-h-[22px] text-[15px] font-semibold">{text ?? " "}</span>
    </div>
  );
}
