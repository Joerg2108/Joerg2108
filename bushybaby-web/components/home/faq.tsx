"use client";

import { useId, useState } from "react";
import { clsx } from "clsx";

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState(0);
  const base = useId();
  return (
    <div className="border-t border-white/10">
      {items.map((f, i) => {
        const isOpen = open === i;
        const btn = `${base}-q${i}`;
        const panel = `${base}-a${i}`;
        return (
          <div key={f.q} className="border-b border-white/10">
            <h3>
              <button
                id={btn}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panel}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex min-h-[72px] w-full items-center justify-between gap-6 py-5 text-left text-[19px] font-medium tracking-[-0.01em]"
              >
                {f.q}
                <span aria-hidden className={clsx("flex size-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-mist transition-transform duration-500 ease-land", isOpen && "rotate-45")}>+</span>
              </button>
            </h3>
            {/* grid-rows trick: animates height without measuring */}
            <div id={panel} role="region" aria-labelledby={btn} className={clsx("grid transition-[grid-template-rows] duration-500 ease-land", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
              <div className="overflow-hidden" inert={!isOpen}>
                <p className="pb-7 pr-14 leading-relaxed text-mist">{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
