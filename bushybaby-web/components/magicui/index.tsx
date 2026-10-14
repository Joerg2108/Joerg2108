/**
 * Lean ports of the Magic UI components used by the design
 * (magicui.design — MIT). Same API shape as the registry versions, so you can
 * swap any of them for the official one later:
 *   npx shadcn@latest add "https://magicui.design/r/shimmer-button"
 * Kept dependency-free (CSS animations) for a smaller JS bundle.
 */
"use client";

import { clsx } from "clsx";
import { useRef, type CSSProperties, type ComponentPropsWithoutRef, type ReactNode } from "react";

/* ── ShimmerButton ───────────────────────────────────────────────────────── */
type ShimmerProps = { shimmerColor?: string; background?: string; className?: string; children: ReactNode };

export function ShimmerButton({ shimmerColor = "#ffaa40", background = "#0a0a0a", className, children, ...rest }: ShimmerProps & ComponentPropsWithoutRef<"a">) {
  return (
    <a
      {...rest}
      style={{ "--spread": "90deg", "--shimmer-color": shimmerColor, "--speed": "3s", "--cut": "0.05em", "--bg": background } as CSSProperties}
      className={clsx(
        "group relative z-0 inline-flex h-14 cursor-pointer items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full border border-white/10 px-7 text-base font-semibold text-moon [background:var(--bg)]",
        "transition-transform duration-300 ease-land active:translate-y-px",
        className,
      )}
    >
      <span className="-z-30 absolute inset-0 overflow-visible blur-[2px] [container-type:size]">
        <span className="absolute inset-0 h-[100cqh] animate-shimmer-slide [aspect-ratio:1] [border-radius:0] [mask:none]">
          <span className="absolute -inset-full w-auto rotate-0 animate-spin-around [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0]" />
        </span>
      </span>
      {children}
      <span className="absolute inset-0 rounded-full shadow-[inset_0_-8px_10px_#ffffff1f] transition-all duration-300 ease-land group-hover:shadow-[inset_0_-6px_10px_#ffffff3f]" />
      <span className="absolute -z-20 rounded-full [background:var(--bg)] [inset:var(--cut)]" />
    </a>
  );
}

/* ── AuroraText ──────────────────────────────────────────────────────────── */
export function AuroraText({ children, colors = ["#ffaa40", "#ff7a3d", "#9c40ff", "#ffaa40"], className }: { children: ReactNode; colors?: string[]; className?: string }) {
  return (
    <span className={clsx("relative inline-block", className)}>
      <span className="sr-only">{children}</span>
      <span
        aria-hidden="true"
        className="animate-aurora bg-clip-text text-transparent [-webkit-background-clip:text]"
        style={{ backgroundImage: `linear-gradient(135deg, ${colors.join(", ")}, ${colors[0]})`, backgroundSize: "200% auto" }}
      >
        {children}
      </span>
    </span>
  );
}

/* ── Marquee ─────────────────────────────────────────────────────────────── */
export function Marquee({ children, reverse, pauseOnHover, repeat = 4, duration = "40s", gap = "3rem", className }: { children: ReactNode; reverse?: boolean; pauseOnHover?: boolean; repeat?: number; duration?: string; gap?: string; className?: string }) {
  return (
    <div className={clsx("group flex overflow-hidden [gap:var(--gap)]", className)} style={{ "--duration": duration, "--gap": gap } as CSSProperties}>
      {Array.from({ length: repeat }, (_, i) => (
        <div
          key={i}
          aria-hidden={i > 0 || undefined}
          className={clsx("flex shrink-0 animate-marquee items-center justify-around [gap:var(--gap)]", reverse && "[animation-direction:reverse]", pauseOnHover && "group-hover:[animation-play-state:paused]")}
        >
          {children}
        </div>
      ))}
    </div>
  );
}

/* ── MagicCard (cursor spotlight + gradient border) ──────────────────────── */
export function MagicCard({ children, className, gradientFrom = "#ffaa40", gradientTo = "#9c40ff", gradientSize = 260 }: { children: ReactNode; className?: string; gradientFrom?: string; gradientTo?: string; gradientSize?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !ref.current) return; // fine pointers only
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--mx", `${e.clientX - r.left}px`);
    ref.current.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  const leave = () => {
    ref.current?.style.setProperty("--mx", `-${gradientSize}px`);
    ref.current?.style.setProperty("--my", `-${gradientSize}px`);
  };
  return (
    <div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      style={{ "--mx": `-${gradientSize}px`, "--my": `-${gradientSize}px`, "--gs": `${gradientSize}px` } as CSSProperties}
      className={clsx("group relative rounded-card p-px", className)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-white/10 transition-opacity duration-300"
        style={{ background: `radial-gradient(var(--gs) circle at var(--mx) var(--my), ${gradientFrom}, ${gradientTo}, rgb(255 255 255 / .1) 100%)` }}
      />
      <div className="relative h-full rounded-[27px] bg-surface-1">
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: "radial-gradient(var(--gs) circle at var(--mx) var(--my), #262626, transparent 100%)" }} />
        <div className="relative h-full">{children}</div>
      </div>
    </div>
  );
}

/* ── BorderBeam ──────────────────────────────────────────────────────────── */
export function BorderBeam({ size = 140, duration = 9, colorFrom = "#ffaa40", colorTo = "#9c40ff" }: { size?: number; duration?: number; colorFrom?: string; colorTo?: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]">
      <div
        className="absolute aspect-square animate-border-beam"
        style={{ width: size, offsetPath: `rect(0 auto auto 0 round ${size}px)`, background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`, "--beam-duration": `${duration}s` } as CSSProperties}
      />
    </div>
  );
}

/* ── DotPattern ──────────────────────────────────────────────────────────── */
export function DotPattern({ className, spacing = 22, radius = 1 }: { className?: string; spacing?: number; radius?: number }) {
  return (
    <svg aria-hidden className={clsx("pointer-events-none absolute inset-0 h-full w-full fill-current", className)}>
      <defs>
        <pattern id="bb-dots" width={spacing} height={spacing} patternUnits="userSpaceOnUse">
          <circle cx={spacing / 2} cy={spacing / 2} r={radius} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#bb-dots)" />
    </svg>
  );
}
