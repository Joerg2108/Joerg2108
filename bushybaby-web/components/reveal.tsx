"use client";

import { MotionConfig, motion } from "motion/react";
import type { ReactNode } from "react";

const land = [0.22, 1, 0.36, 1] as const;

/**
 * Honors the OS "reduce motion" setting for every motion component below.
 * Done via MotionConfig instead of branching on useReducedMotion(), because the
 * server can't know the setting — branching would render different markup on
 * server and client (hydration mismatch).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Section reveal: y 32→0, blur 8→0, 900ms out-expo (motion spec, canvas board 13). */
export function Reveal({ children, delay = 0, className, as = "div" }: { children: ReactNode; delay?: number; className?: string; as?: "div" | "li" }) {
  const Tag = as === "li" ? motion.li : motion.div;
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 32, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.9, ease: land, delay }}
    >
      {children}
    </Tag>
  );
}

/**
 * Headline words rise one after another (stagger 60ms).
 * Pure CSS on purpose: it starts with the first paint, needs no JS (the hero
 * headline is the LCP element) and the reduced-motion rule simply shows it.
 */
export function WordRise({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <span className="inline-block animate-word-rise" style={{ animationDelay: `${100 + i * 60}ms` }}>{w}</span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}
