"use client"

// Wild Hunt Footer — a poster-red site footer under a romantic painting. The
// sky dissolves into the red field through an ordered-dither edge while the
// figures, supplied as a cut-out layer, ride on over it as crisp silhouettes,
// red filling in around hooves and hair. The wordmark is set
// in a bitmap blackletter drawn for this component (41 glyphs in a 20-row cell
// grid, no font file), and a calligraphic flourish writes itself across it,
// carving a knockout through the letters. Tiny tracked captions, dotted guide
// circles, coordinate ticks and a pointer reticle finish the sheet.
//
// Storyboard, from the moment it scrolls into view: the picture rasters in from
// the top and breaks into pixels where it meets the red; the wordmark resolves
// from 8-cell blocks to 4, to 2, to 1; the flourish writes through it; the
// captions wipe in with a stagger. The pointer carries a dotted reticle with its
// grid coordinate, scatters the letter cells it passes and clears the dither to
// show more of the painting beneath. A click runs a scanline down the sheet that
// re-rasters whatever it crosses.
//
// One file, React only. Three small canvases (dither, wordmark, grain), one
// SVG for the marks and the flourish, real anchors for the links. Every rule in
// the scoped <style> is .whf- prefixed. The only things fetched are the picture
// and its cut-out, both props; the defaults are Peter Nicolai Arbo's
// "Åsgårdsreien" (1872), public domain, from Wikimedia Commons, and a subject
// matte of its riders kept in this component's own repository.

import * as React from "react"

export interface WildHuntImage {
  /** The painting or photograph. Any origin: its pixels are never read. */
  src: string
  alt?: string
  /** CSS object-position, shared with the cut-out so the two register. Defaults to "50% 26%". */
  position?: string
  /**
   * The same picture with everything but its subject made transparent (PNG or
   * WebP with alpha, same proportions as `src`). It is drawn crisp above the
   * dissolve, so the figures ride out over the red. Omit it and the whole
   * picture dissolves.
   */
  cutout?: string
}

export interface FooterLink {
  label: string
  href?: string
}

export interface FooterColumn {
  title: string
  links: FooterLink[]
}

export type WildHuntPreset = "vermilion" | "ink" | "cobalt" | "bone"

export interface WildHuntFooterProps {
  /** The giant word. Letters, digits, & . - ' ! are drawn in the bitmap blackletter; anything else falls back to the page's bold face, pixelated. */
  wordmark?: string
  /** The picture across the top. */
  image?: WildHuntImage
  /** The picture's box, as a fraction of the footer's height, 0.3–0.8. The cut-out reaches its bottom; the plain picture is red well before it. Defaults to 0.62. */
  imageHeight?: number
  /** Where the dissolve begins, as a fraction of the picture's box. It is fully red 0.28 further down. Defaults to 0.4. */
  dissolve?: number
  /** Vertical caption on the left, read bottom to top. */
  tagline?: string
  /** Vertical caption on the right, read top to bottom. */
  sideNote?: string
  /** Link columns along the bottom. */
  columns?: FooterColumn[]
  /** The small paragraph at the very bottom. */
  colophon?: string
  /** The © line. */
  legal?: string
  /** Show the back-to-top link. Defaults to true. */
  backToTop?: boolean
  /** The two small sun sigils by the legal line. Defaults to true. */
  sigils?: boolean
  /** Starting colours. Defaults to "vermilion". */
  preset?: WildHuntPreset
  /** Colour overrides, merged over the preset. */
  palette?: { background?: string; ink?: string }
  /** Cells between letters. Defaults to 2. */
  tracking?: number
  /** Print grain over everything, 0–1. Defaults to 0.6. */
  grain?: number
  /** Pointer and click response. Defaults to true. */
  interactive?: boolean
  /** Face for the small captions. */
  fontFamily?: string
  /** Face for the coordinates and the reticle. */
  monoFamily?: string
  /** Root height. A definite length, never a percentage. */
  height?: string
  /** Extra root class names. */
  className?: string
}

const PRESETS: { [k: string]: { background: string; ink: string } } = {
  vermilion: { background: "#e2281b", ink: "#f4efe5" },
  ink: { background: "#100f0e", ink: "#ebe5d7" },
  cobalt: { background: "#1b2db0", ink: "#eef0ff" },
  bone: { background: "#ebe5d8", ink: "#17130f" },
}

// The riders, matted out of the painting (Photoshop select-subject on the
// 3840px scan, exported as WebP with alpha) and pinned to a commit of this
// component's repository on jsDelivr, so the URL never moves.
const DEFAULT_CUTOUT = "https://cdn.21st.dev/assets/mirror/69/692fb74acc74e0097901ca85075b1efbfdeebcb4d5edfe99874e9ec7e4847e0a.webp"

const DEFAULT_IMAGE: WildHuntImage = {
  src: "https://cdn.21st.dev/assets/mirror/67/671b69b8614847816a300a1d11ee5704a7b2f5c51b8b50d45f17dfc49af09b68.jpg",
  alt: "Åsgårdsreien — the Wild Hunt of Odin — riders and valkyries storming across a night sky, by Peter Nicolai Arbo, 1872",
  position: "50% 26%",
  cutout: DEFAULT_CUTOUT,
}

const DEFAULT_COLUMNS: FooterColumn[] = [
  { title: "Work", links: [{ label: "Index" }, { label: "Archive" }, { label: "Journal" }] },
  { title: "Studio", links: [{ label: "About" }, { label: "Process" }, { label: "Careers" }] },
  { title: "Elsewhere", links: [{ label: "Instagram" }, { label: "Are.na" }, { label: "GitHub" }] },
  { title: "Contact", links: [{ label: "hello@huginn.studio" }, { label: "+47 22 00 41 00" }] },
]

const SANS_STACK = '"Inter", "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif'
const MONO_STACK = '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace'

// The bitmap blackletter. Each glyph is "<width>:<hex>" — 22 rows (one above
// the cap line, twenty of letter, one below the baseline), each row packed
// left-to-right into ceil(width / 4) hex digits. Drawn with a simulated
// broad-nib pen at 42° and sampled to the grid, so stems, lozenge terminals
// and hairlines all come from one hand.
const WHF_GLYPHS: { [ch: string]: string } = {
  "A": "15:00000000000c00fc01fc003c003c083c183c183c183c183c303c3ffc303c303c303c303c3038e03080000000",
  "B": "15:00000800dfc0ffe078e0787078707860786078007fe07ff078787838781878187818780078007fc000000000",
  "C": "14:000001e007f80ff810783000700070007100700070007000700070007100700078007c003fe01fc00f800000",
  "D": "15:00000800dfc0ffe078f878787838781878187818781878187818781878187818781078007f807f0000000000",
  "E": "14:000001e007f80ff810783000700070007000700071e073e0700070007000700078007c003fe01fc00f800000",
  "F": "14:000004007ffc5ff01c001c001c001c001c001c001fe01fc01c001c001c001c001c001c001c00380070000000",
  "G": "15:000001e007f80ff8107830007000700070007000700070fc701c701c701c701c78187c003fe01fc00f800000",
  "H": "15:00000000d80cf81c783c783c783c783c783c783c7ffc7ffc783c783c783c783c783c783c7038603000000000",
  "I": "10:0000407c05c01c01c81c01c01c01c01c81c01c01c01c01c01c01c01c03f0100000",
  "J": "12:0000080fe1fc03803a03803803803803a0380380380380380380380380b03e07c0",
  "K": "15:00000000d81cf838787078e078e079c07b807b007f007e007f007b807bc079e078f07878703c601800000000",
  "L": "14:00000000d800f800780078007800780078007800780078007800780078007800780078007fe07fc000000000",
  "M": "18:00000000006ff8057dc073ce073c6073ce073ce073ce073ce073ce073ce073ce073ce073ce073ce073ce073ce0738e0630c04000000000",
  "N": "15:00000000d80cf81c783c7c3c7c3c7e3c7e3c7f3c7b3c7bbc79fc78fc78fc787c787c783c7038603000000000",
  "O": "15:0000000007f00ff8007c307c313c711c711c711c729c739c711c711c711c791c78187c103fe01fc000000000",
  "P": "15:00000800dfe0fff0787878387818781878187818781078007f807f0078007800780078007000e000c0000000",
  "Q": "15:0000000007f00ff8007c307c313c711c711c711c729c739c711c711c711c791c78187cd03fe01ff00038001c",
  "R": "15:00000800dfe0fff0787878387818781878187818780078007f807fc079e078e078707878703c601800000000",
  "S": "14:0000000007f00ff8107030003000300038003e001fc00ff000f8007800380018001838107fc03fc000000000",
  "T": "15:000000803ffc7ff803800380038003800380038003800380038003800380038003800380038007000e000000",
  "U": "15:00000000d80cf81c783c783c783c783c783c783c783c783c783c783c783c7c3c3c3c3e3c1ff80ff00f800000",
  "V": "15:00000000d008f01870187018701870187018701870187018701878187c107e003e001f000f80070000000000",
  "W": "19:0000010000f061870e3871e3871e3871e3871e3871e3871e3871e3871e3871e3879e3879f307df303ffa01f7e01e3c00c3800810000000",
  "X": "15:00000000100c381c3c381c301e700e6007e007c0038003c003c007e00ee00c701c7018383838301000000000",
  "Y": "15:00000008d818f8387838783878387838783878387c387c383ff81ff80fb80038003800380038003003e007c0",
  "Z": "14:000000003ff87ffc001c00380070006000e001c007c00fc0070006000e001c00180038003ff83ff800000000",
  "0": "13:0000000007e00fe011f030f0707070707070707070707070707070707070707078607c403f803f0000000000",
  "1": "11:0000200600e00e00e00e00e00e00e00e00e00e00e00e00e00e00e00e03f8080000",
  "2": "13:0000000007e00ff0107020300030003000200040000000000000000000000000000020003ff03ff000000000",
  "3": "13:000000001f803fc000e00060006000600040000007c007e000f0007000300030003030207f801f0000000000",
  "4": "14:000000100030007000f001f003f0037007700e700c701c70387030707ff80070007000700070006000400000",
  "5": "13:000000000ff01fc0100030003000300030003fc03fe000f00070003000300030003030207f803f0000000000",
  "6": "13:0000000007e00fe010e03000300070007000700077e077f07070703070307030703078203fc01f8000000000",
  "7": "13:000000003ff87ff00010003000200060006000c000c000c00180018001800300030003000600040000000000",
  "8": "13:00000000078007c018c018c018c018c01c001e000f00078001e010e030603060306038403f001f0000000000",
  "9": "13:0000000007c00fe020f0207060306030703078307ff03f300030003000300030002018403f801f0000000000",
  "&": "15:000000000f801f8031c031c030803180390038001c000e000700238023c861f070f070783ebc1f1800000000",
  ".": "4:000000000000000004f640",
  "-": "8:000000000000000000003e7c00000000000000000000",
  "'": "4:0026640000000000000000",
  "!": "6:00001838787878787878787878706000000030300000",
}

const BAYER = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
]

// #region raster
// Pure helpers, lifted out and executed by tests/wild-hunt-footer.test.mjs.

export const WHF_ROWS = 22

/** Unpack "<width>:<hex>" into rows of "#" and ".". */
export function whfDecode(packed: string) {
  const i = packed.indexOf(":")
  const w = parseInt(packed.slice(0, i), 10)
  const hex = packed.slice(i + 1)
  const nd = (w + 3) >> 2
  const rows: string[] = []
  for (let r = 0; r < WHF_ROWS; r++) {
    const v = parseInt(hex.slice(r * nd, (r + 1) * nd) || "0", 16)
    let s = ""
    for (let c = 0; c < w; c++) s += (v >> (nd * 4 - 1 - c)) & 1 ? "#" : "."
    rows.push(s)
  }
  return { w, rows }
}

/** Pack rows of "#" and "." back into the "<width>:<hex>" form. */
export function whfPack(rows: string[]) {
  const w = rows[0] ? rows[0].length : 0
  const nd = (w + 3) >> 2
  let hex = ""
  for (let r = 0; r < WHF_ROWS; r++) {
    let v = 0
    const row = rows[r] || ""
    for (let c = 0; c < nd * 4; c++) v = (v << 1) | (row[c] === "#" ? 1 : 0)
    hex += v.toString(16).padStart(nd, "0")
  }
  return w + ":" + hex
}

/**
 * Lay a word out on the cell grid. Returns the total width in cells and the
 * lit cells as flat [x, y, x, y, …]. Lowercase is set as capitals, a space is
 * six cells, and a character the glyph map lacks is skipped.
 */
export function whfCompose(word: string, glyphs: { [ch: string]: string }, tracking: number) {
  const cells: number[] = []
  let x = 0
  const gap = Math.max(0, Math.round(tracking))
  const chars = Array.from(word.toUpperCase())
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    if (ch === " ") {
      x += 6 + gap
      continue
    }
    const packed = glyphs[ch]
    if (!packed) continue
    const g = whfDecode(packed)
    for (let r = 0; r < WHF_ROWS; r++) {
      const row = g.rows[r]
      for (let c = 0; c < g.w; c++) if (row[c] === "#") cells.push(x + c, r)
    }
    x += g.w + gap
  }
  return { cols: Math.max(0, x - gap), cells }
}

/** The blocks of `level` × `level` cells that contain any lit cell, as flat [bx, by, …]. */
export function whfBlocks(cells: number[], level: number) {
  const seen: { [k: string]: boolean } = {}
  const out: number[] = []
  for (let i = 0; i < cells.length; i += 2) {
    const bx = Math.floor(cells[i] / level)
    const by = Math.floor(cells[i + 1] / level)
    const k = bx + "," + by
    if (seen[k]) continue
    seen[k] = true
    out.push(bx, by)
  }
  return out
}

/** How much of a picture row is covered in red: 0 above `start`, 1 from `start + span` down, eased between. */
export function whfDissolve(yFrac: number, start: number, span: number) {
  const s = Math.min(0.95, Math.max(0, start))
  const w = Math.max(0.02, span)
  const t = Math.min(1, Math.max(0, (yFrac - s) / w))
  const e = t * t * (3 - 2 * t)
  return e * e * (3 - 2 * e)
}

export const WHF_SPAN = 0.28

/** Deterministic noise in [0, 1) for cell i in frame bucket b. */
export function whfHash(i: number, b: number) {
  let h = (Math.imul(i, 374761393) + Math.imul(b, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** The reticle's grid coordinate: sixteen columns A–P across, nine rows 1–9 down. */
export function whfCoord(x: number, y: number, w: number, h: number) {
  const c = Math.min(15, Math.max(0, Math.floor((x / Math.max(1, w)) * 16)))
  const r = Math.min(8, Math.max(0, Math.floor((y / Math.max(1, h)) * 9)))
  return String.fromCharCode(65 + c) + (r + 1)
}

/**
 * The flourish, in the coordinates of a word box W × H. It overshoots the box
 * by `over` px on each side (a loop at the left, a tail at the right), so a
 * long word on a narrow screen does not run it off the sheet.
 */
export function whfSwash(W: number, H: number, over: number) {
  const o = Math.max(0, over)
  const p = (x: number, y: number) => (x * W).toFixed(1) + " " + (y * H).toFixed(1)
  const l = (x: number, y: number) => (x * o).toFixed(1) + " " + (y * H).toFixed(1)
  const r = (x: number, y: number) => (W + x * o).toFixed(1) + " " + (y * H).toFixed(1)
  return (
    "M " + l(-1, 0.84) +
    " C " + l(-0.3, 1.08) + " " + l(1.1, 1.04) + " " + l(0.85, 0.72) +
    " C " + l(0.7, 0.5) + " " + l(-0.55, 0.44) + " " + l(-0.4, 0.62) +
    " C " + l(-0.25, 0.82) + " " + p(0.2, 0.92) + " " + p(0.42, 0.66) +
    " C " + p(0.58, 0.46) + " " + p(0.72, 0.1) + " " + p(0.86, 0.16) +
    " C " + p(0.98, 0.21) + " " + p(0.9, 0.44) + " " + p(0.8, 0.36) +
    " C " + p(0.73, 0.3) + " " + p(0.84, 0.04) + " " + r(0, 0.18) +
    " C " + r(0.85, 0.27) + " " + r(0.98, 0.52) + " " + r(0.35, 0.72)
  )
}

/** Hex → [r, g, b], or null for anything that isn't #rgb / #rrggbb. */
export function whfHex(hex: string) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || "").trim())
  if (!m) return null
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
// #endregion

const WHF_CSS = `
.whf-root {
  position: relative; width: 100%; overflow: hidden; isolation: isolate; container-type: inline-size;
  background: var(--whf-bg); color: var(--whf-ink); -webkit-font-smoothing: antialiased;
  font-family: var(--whf-font); --whf-pad: clamp(18px, 3.2vw, 48px); --whf-ease: cubic-bezier(.65, 0, .2, 1);
}
.whf-root, .whf-root * { box-sizing: border-box; }
.whf-picture { position: absolute; left: 0; top: 0; width: 100%; overflow: hidden; z-index: 0; }
.whf-picture img {
  position: absolute; inset: 0; width: 100%; height: 100%; max-width: none; object-fit: cover; display: block;
  filter: saturate(.92) contrast(1.04);
}
.whf-tint { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 30%, color-mix(in srgb, var(--whf-bg) 55%, transparent) 70%); }
.whf-picture .whf-cutout {
  filter: none; z-index: 1; pointer-events: none; clip-path: inset(0 0 100% 0);
  transition: clip-path 1.1s linear .1s;
}
.whf-root.is-in .whf-picture .whf-cutout { clip-path: inset(0 0 0 0); }
.whf-dither { position: absolute; left: 0; top: 0; image-rendering: pixelated; image-rendering: crisp-edges; display: block; max-width: none; }
.whf-grain { position: absolute; inset: 0; width: 100%; height: 100%; display: block; max-width: none; z-index: 2; pointer-events: none; mix-blend-mode: overlay; }
.whf-marks { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 3; pointer-events: none; overflow: visible; display: block; }
.whf-marks text { font-family: var(--whf-mono); font-size: 9px; letter-spacing: .14em; fill: var(--whf-ink); }
.whf-marks .whf-fade { opacity: 0; transition: opacity .6s var(--whf-ease); transition-delay: var(--d, 0s); }
.whf-root.is-in .whf-marks .whf-fade { opacity: 1; }
.whf-word { position: absolute; left: 0; top: 0; display: block; max-width: none; z-index: 4; }
.whf-swash { position: absolute; left: 0; top: 0; overflow: visible; z-index: 5; pointer-events: none; display: block; }
.whf-swash path { fill: none; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; stroke-dasharray: 1; stroke-dashoffset: 1; }
.whf-swash .whf-cut { stroke: var(--whf-bg); stroke-width: 5.5; }
.whf-swash .whf-pen { stroke: var(--whf-ink); stroke-width: 1.35; }
.whf-root.is-in .whf-swash path { stroke-dashoffset: 0; transition: stroke-dashoffset 1.25s var(--whf-ease) .95s; }
.whf-vert, .whf-foot { font-size: 10px; line-height: 1.55; letter-spacing: .16em; text-transform: uppercase; }
.whf-vert {
  position: absolute; top: 44%; height: 32%; z-index: 6; margin: 0; max-width: 8em; display: flex; gap: .7em;
  writing-mode: vertical-rl; overflow: hidden; opacity: .9;
}
.whf-vert.whf-l { left: var(--whf-pad); transform: rotate(180deg); }
.whf-vert.whf-r { right: var(--whf-pad); }
.whf-wipe { clip-path: inset(0 100% 0 0); transition: clip-path .7s var(--whf-ease); transition-delay: var(--d, 0s); }
.whf-vert.whf-wipe { clip-path: inset(100% 0 0 0); }
.whf-root.is-in .whf-wipe { clip-path: inset(0 0 0 0); }
.whf-foot {
  position: absolute; left: 0; right: 0; bottom: 0; z-index: 6; padding: 0 var(--whf-pad) 18px;
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)) auto; column-gap: 20px; row-gap: 0; align-items: start;
}
.whf-col h3 { margin: 0 0 .25em; font: inherit; opacity: .55; }
.whf-col ul { list-style: none; margin: 0; padding: 0; }
.whf-col a, .whf-up {
  color: inherit; text-decoration: none; opacity: .9; background: none; border: 0; padding: 0; cursor: pointer;
  font: inherit; letter-spacing: inherit; text-transform: inherit;
  background-image: linear-gradient(currentColor, currentColor); background-size: 0% 1px;
  background-repeat: no-repeat; background-position: 0 100%; transition: opacity .25s ease, background-size .35s var(--whf-ease);
}
.whf-col a:hover, .whf-up:hover { opacity: 1; background-size: 100% 1px; }
.whf-col a:focus-visible, .whf-up:focus-visible { outline: 1px solid currentColor; outline-offset: 3px; opacity: 1; }
.whf-up { justify-self: end; white-space: nowrap; }
.whf-up::before { content: "↑"; display: inline-block; margin-right: .6em; transition: transform .35s var(--whf-ease); }
.whf-up:hover::before { transform: translateY(-2px); }
.whf-legal {
  grid-column: 1 / -1; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr); gap: 20px; align-items: end;
  margin-top: 18px; padding-top: 11px; border-top: 1px dotted color-mix(in srgb, var(--whf-ink) 38%, transparent);
  font-size: 9.5px; letter-spacing: .12em; text-transform: none; line-height: 1.55;
}
.whf-legal p { margin: 0; opacity: .72; }
.whf-sig { display: flex; align-items: center; gap: 12px; }
.whf-sig svg { width: 14px; height: 14px; display: block; fill: none; stroke: currentColor; stroke-width: 1; opacity: .85; }
.whf-sig span { opacity: .72; white-space: nowrap; }
.whf-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@container (max-width: 960px) {
  .whf-foot { grid-template-columns: repeat(4, minmax(0, 1fr)); row-gap: 14px; }
  .whf-up { grid-column: 1 / -1; justify-self: start; }
}
@container (max-width: 720px) {
  .whf-vert { display: none; }
  .whf-foot { grid-template-columns: repeat(2, minmax(0, 1fr)); padding-bottom: 14px; }
  .whf-legal { grid-template-columns: minmax(0, 1fr); margin-top: 10px; }
  .whf-marks .whf-tick text { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .whf-marks .whf-fade, .whf-wipe, .whf-swash path, .whf-col a, .whf-up, .whf-up::before, .whf-picture .whf-cutout { transition: none !important; }
}
`

export default function WildHuntFooter({
  wordmark = "HUGINN",
  image = DEFAULT_IMAGE,
  imageHeight = 0.62,
  dissolve = 0.4,
  tagline = "Thought flies out at dawn · over the whole of the world · and is back by supper",
  sideNote = "Founded 2019 · Oslo & Reykjavík · a studio for slow software",
  columns = DEFAULT_COLUMNS,
  colophon = "Painting: Peter Nicolai Arbo, Åsgårdsreien (The Wild Hunt of Odin), 1872. Nasjonalmuseet, Oslo. Public domain, via Wikimedia Commons. The blackletter is drawn in cells; nothing on this sheet is a font.",
  legal = "© 2026 Huginn Studio",
  backToTop = true,
  sigils = true,
  preset = "vermilion",
  palette,
  tracking = 2,
  grain = 0.6,
  interactive = true,
  fontFamily = SANS_STACK,
  monoFamily = MONO_STACK,
  height = "min(100svh, 920px)",
  className = "",
}: WildHuntFooterProps) {
  const colors = { ...(PRESETS[preset] || PRESETS.vermilion), ...(palette || {}) }
  const rootRef = React.useRef(null as HTMLElement | null)
  const pictureRef = React.useRef(null as HTMLDivElement | null)
  const ditherRef = React.useRef(null as HTMLCanvasElement | null)
  const wordRef = React.useRef(null as HTMLCanvasElement | null)
  const grainRef = React.useRef(null as HTMLCanvasElement | null)
  const marksRef = React.useRef(null as SVGSVGElement | null)
  const swashRef = React.useRef(null as SVGSVGElement | null)
  const footRef = React.useRef(null as HTMLDivElement | null)
  const hasCutout = !!image.cutout
  const opts = React.useRef({ colors, wordmark, imageHeight, dissolve, tracking, grain, interactive, fontFamily, hasCutout })
  opts.current = { colors, wordmark, imageHeight, dissolve, tracking, grain, interactive, fontFamily, hasCutout }
  const key = [wordmark, imageHeight, dissolve, tracking, grain, colors.background, colors.ink, fontFamily, hasCutout].join("|")

  React.useEffect(() => {
    const root = rootRef.current
    const picture = pictureRef.current
    const dcv = ditherRef.current
    const wcv = wordRef.current
    const gcv = grainRef.current
    const marks = marksRef.current
    const swash = swashRef.current
    if (!root || !picture || !dcv || !wcv || !gcv || !marks || !swash) return
    const dctx = dcv.getContext("2d")
    const wctx = wcv.getContext("2d")
    const gctx = gcv.getContext("2d")
    if (!dctx || !wctx || !gctx) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const q = (sel: string) => marks.querySelector(sel) as SVGElement | null
    const circleA = q(".whf-ca")
    const circleB = q(".whf-cb")
    const guideL = q(".whf-gl")
    const guideR = q(".whf-gr")
    const ticks = q(".whf-tick")
    const ret = q(".whf-ret")
    const retH = q(".whf-rh")
    const retV = q(".whf-rv")
    const retC = q(".whf-rc")
    const retT = q(".whf-rt")
    const sweepLine = q(".whf-sl")
    const paths = Array.from(swash.querySelectorAll("path"))

    let w = 0
    let h = 0
    let dpr = 1
    let bandH = 0
    let pixel = 4
    let dcols = 0
    let drows = 0
    let dimg = null as ImageData | null
    let wob = new Float32Array(0)
    let cell = 8
    let cols = 0
    let cells: number[] = []
    let blocks: { [level: number]: number[] } = {}
    let box = { x: 0, y: 0, w: 0, h: 0 }
    let px = -1e5
    let py = -1e5
    let inside = false
    let heat = 0
    let heatAt = 0
    let t0 = -1
    let sweepAt = -1e9
    let raf = 0
    let visible = true
    let awake = true
    let alive = true
    const bg = whfHex(opts.current.colors.background) || [226, 40, 27]
    const fallback: { [ch: string]: string } = {}

    // A character the blackletter lacks is set in the page's bold face and
    // sampled to the same 20-row grid, so any wordmark still renders.
    const glyphFor = (ch: string) => {
      if (WHF_GLYPHS[ch]) return WHF_GLYPHS[ch]
      if (fallback[ch]) return fallback[ch]
      const c = document.createElement("canvas")
      c.width = 40
      c.height = WHF_ROWS
      const x = c.getContext("2d", { willReadFrequently: true })
      if (!x) return ""
      x.font = "bold 20px " + opts.current.fontFamily
      x.textBaseline = "alphabetic"
      const width = Math.min(36, Math.ceil(x.measureText(ch).width))
      if (width <= 0) return ""
      x.fillStyle = "#000"
      x.fillText(ch, 1, 20)
      const d = x.getImageData(0, 0, c.width, c.height).data
      const rows: string[] = []
      for (let r = 0; r < WHF_ROWS; r++) {
        let s = ""
        for (let cx = 0; cx < width + 2; cx++) s += d[(r * c.width + cx) * 4 + 3] > 110 ? "#" : "."
        rows.push(s)
      }
      fallback[ch] = whfPack(rows)
      return fallback[ch]
    }

    const layout = () => {
      const o = opts.current
      const rect = root.getBoundingClientRect()
      w = Math.max(1, Math.round(rect.width))
      h = Math.max(1, Math.round(rect.height))
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const narrow = w < 720
      const pad = Math.round(Math.max(18, Math.min(48, w * 0.032)))

      // The word: as large as the room between the picture and the columns allows.
      const glyphs: { [ch: string]: string } = {}
      for (const ch of Array.from(o.wordmark.toUpperCase())) if (ch !== " " && !glyphs[ch]) glyphs[ch] = glyphFor(ch)
      const composed = whfCompose(o.wordmark, glyphs, o.tracking)
      cols = Math.max(1, composed.cols)
      cells = composed.cells
      blocks = { 8: whfBlocks(cells, 8), 4: whfBlocks(cells, 4), 2: whfBlocks(cells, 2) }
      const frac = Math.min(0.8, Math.max(0.3, narrow ? Math.min(o.imageHeight, 0.5) : o.imageHeight))
      bandH = Math.round(h * frac)
      const footH = footRef.current ? footRef.current.offsetHeight : 0
      // The plain picture is red from here down; the cut-out may hang lower, over the word's ticks.
      const redY = bandH * (Math.min(0.7, Math.max(0.1, o.dissolve)) + WHF_SPAN)
      const zoneTop = Math.round(Math.min(bandH + 8, Math.max(redY + 8, bandH - h * 0.07)))
      const zoneBottom = h - footH - 10
      const zoneH = Math.max(40, zoneBottom - zoneTop)
      const sidePad = narrow ? pad : pad + 36
      cell = Math.max(2, Math.floor(Math.min((w - sidePad * 2) / cols, (zoneH * 0.84) / WHF_ROWS)))
      const bw = cols * cell
      const bh = WHF_ROWS * cell
      // Under a cut-out the word sits centred, leaving the figures their room; under a plain picture it rises toward the red edge.
      box = { x: Math.round((w - bw) / 2), y: Math.round(zoneTop + (zoneH - bh) * (o.hasCutout ? 0.5 : 0.3)), w: bw, h: bh }

      picture.style.height = bandH + "px"
      for (const el of Array.from(root.querySelectorAll(".whf-vert")) as HTMLElement[]) {
        el.style.top = zoneTop + 6 + "px"
        el.style.height = Math.max(0, zoneH - 12) + "px"
      }
      // The dither grid: coarser than the letters, so the two scales read as one hand.
      pixel = Math.max(3, Math.min(6, Math.round(cell / 2)))
      dcols = Math.ceil(w / pixel)
      drows = Math.ceil(bandH / pixel)
      dcv.width = dcols
      dcv.height = drows
      dcv.style.width = dcols * pixel + "px"
      dcv.style.height = drows * pixel + "px"
      dimg = dctx.createImageData(dcols, drows)
      wob = new Float32Array(dcols)
      for (let x = 0; x < dcols; x++) {
        const u = x / dcols
        wob[x] = 0.07 * Math.sin(u * 11.3 + 1.7) + 0.045 * Math.sin(u * 29.1 + 0.4) + 0.03 * Math.sin(u * 71 + 2.9) + 0.02 * Math.sin(u * 163 + 0.8)
      }

      const m = 4 * cell
      wcv.width = Math.round((bw + m * 2) * dpr)
      wcv.height = Math.round((bh + m * 2) * dpr)
      wcv.style.width = bw + m * 2 + "px"
      wcv.style.height = bh + m * 2 + "px"
      wcv.style.transform = "translate(" + (box.x - m) + "px," + (box.y - m) + "px)"

      swash.style.width = bw + "px"
      swash.style.height = bh + "px"
      swash.style.transform = "translate(" + box.x + "px," + box.y + "px)"
      swash.setAttribute("viewBox", "0 0 " + bw + " " + bh)
      const d = whfSwash(bw, bh, Math.min(bw * 0.14, 110, Math.max(24, box.x - pad - 8)))
      for (const p of paths) p.setAttribute("d", d)

      // Grain and speckle, drawn once.
      gcv.width = Math.round(w * dpr)
      gcv.height = Math.round(h * dpr)
      gctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      gctx.clearRect(0, 0, w, h)
      if (o.grain > 0) {
        const tile = document.createElement("canvas")
        tile.width = 160
        tile.height = 160
        const g = tile.getContext("2d")
        if (g) {
          const id = g.createImageData(160, 160)
          for (let i = 0; i < id.data.length; i += 4) {
            const v = 80 + Math.random() * 175
            id.data[i] = id.data[i + 1] = id.data[i + 2] = v
            id.data[i + 3] = Math.random() < 0.55 ? 0 : 255
          }
          g.putImageData(id, 0, 0)
          const pattern = gctx.createPattern(tile, "repeat")
          if (pattern) {
            gctx.globalAlpha = Math.min(1, o.grain) * 0.5
            gctx.fillStyle = pattern
            gctx.fillRect(0, 0, w, h)
          }
        }
        gctx.globalAlpha = Math.min(1, o.grain) * 0.55
        gctx.fillStyle = "#fff"
        const n = Math.round((w * h) / 2600)
        for (let i = 0; i < n; i++) gctx.fillRect(Math.random() * w, Math.random() * h, 1, 1)
        gctx.globalAlpha = 1
      }

      // The marks.
      marks.setAttribute("viewBox", "0 0 " + w + " " + h)
      const set = (el: SVGElement | null, attrs: { [k: string]: string | number }) => {
        if (!el) return
        for (const k in attrs) el.setAttribute(k, String(attrs[k]))
      }
      set(circleA, { cx: w * 0.085, cy: h * 0.47, r: h * 0.4 })
      set(circleB, { cx: w * 0.87, cy: h * 0.79, r: h * 0.25 })
      const gy1 = box.y - Math.round(cell * 1.6)
      const gy2 = box.y + bh + Math.round(cell * 1.4)
      if (guideL) {
        guideL.setAttribute("transform", "translate(0 " + gy1 + ")")
        set(guideL.querySelector("line"), { x1: pad, x2: Math.max(pad + 40, box.x - cell * 6), y1: 0, y2: 0 })
        set(guideL.querySelector("rect"), { x: pad - 1.5, y: -1.5 })
      }
      if (guideR) {
        guideR.setAttribute("transform", "translate(0 " + gy2 + ")")
        set(guideR.querySelector("line"), { x1: Math.min(w - pad - 40, box.x + bw + cell * 6), x2: w - pad, y1: 0, y2: 0 })
        set(guideR.querySelector("rect"), { x: w - pad - 1.5, y: -1.5 })
      }
      if (ticks) {
        ticks.setAttribute("transform", "translate(" + box.x + " " + (gy1 + 1) + ")")
        const items = Array.from(ticks.querySelectorAll("g"))
        const step = bw / items.length
        items.forEach((it, i) => {
          it.setAttribute("transform", "translate(" + Math.round(i * step) + " 0)")
        })
      }
      set(retH, { x1: 0, x2: w })
      set(retV, { y1: 0, y2: h })
      set(sweepLine, { x1: 0, x2: w })
      awake = true
    }

    const now0 = () => performance.now()
    const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t))

    const drawDither = (now: number, t: number) => {
      if (!dimg) return
      const o = opts.current
      const data = dimg.data
      const start = Math.min(0.7, Math.max(0.1, o.dissolve))
      const scanY = ((t - 60) / 820) * drows * 1.3
      const sweep = now - sweepAt
      const sweepY = sweep < 760 ? (sweep / 760) * h : -1e4
      const R = Math.max(90, Math.min(220, w * 0.15))
      const hot = heat > 0.001 && inside
      const pxp = px
      const pyp = py
      let i = 0
      for (let y = 0; y < drows; y++) {
        const yf = (y + 0.5) / drows
        const base = whfDissolve(yf, start, WHF_SPAN)
        let fr = t < 0 ? 1 : Math.max(base, 1 - smooth((scanY - y) / (drows * 0.32)))
        const yp = (y + 0.5) * pixel
        if (sweepY > -1e3) {
          const back = sweepY - yp
          if (back > 0 && back < 72) fr = Math.max(fr, 1 - back / 72)
        }
        for (let x = 0; x < dcols; x++, i += 4) {
          // Each column's own dissolve line, so the edge breaks like cloud, not a ruler.
          let f = fr
          if (t >= 0 && fr === base) f = whfDissolve(yf + wob[x], start, WHF_SPAN)
          if (hot) {
            const dx = (x + 0.5) * pixel - pxp
            const dy = yp - pyp
            const d = Math.sqrt(dx * dx + dy * dy)
            if (d < R) f -= heat * smooth(1 - d / R) * 0.98
          }
          // Ordered dither with a grain of noise in the threshold, so the screen reads as print, not as a grid.
          const on = (BAYER[(x & 7) | ((y & 7) << 3)] + 0.5) * 0.78 + whfHash(x + y * 4099, 0) * 14 < f * 64
          data[i] = bg[0]
          data[i + 1] = bg[1]
          data[i + 2] = bg[2]
          data[i + 3] = on ? 255 : 0
        }
      }
      dctx.putImageData(dimg, 0, 0)
    }

    const drawWord = (now: number, t: number) => {
      const o = opts.current
      const m = 4 * cell
      wctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      wctx.clearRect(0, 0, wcv.width, wcv.height)
      if (t < 230) return
      wctx.fillStyle = o.colors.ink
      const level = t < 430 ? 8 : t < 630 ? 4 : t < 830 ? 2 : 1
      if (level > 1) {
        const b = blocks[level]
        for (let i = 0; i < b.length; i += 2) wctx.fillRect(m + b[i] * level * cell, m + b[i + 1] * level * cell, level * cell, level * cell)
        return
      }
      const sweep = now - sweepAt
      const sweepY = sweep < 760 ? (sweep / 760) * h - box.y : -1e4
      const bucket = Math.floor(now / 70)
      const R = Math.max(70, Math.min(160, w * 0.1))
      const hot = heat > 0.001 && !reduced
      const lx = px - box.x
      const ly = py - box.y
      const blink = t < 1080 ? ((1080 - t) / 250) * 0.4 : 0
      for (let i = 0; i < cells.length; i += 2) {
        const cx = cells[i]
        const cy = cells[i + 1]
        const yp = (cy + 0.5) * cell
        if (sweepY > -1e3 && yp < sweepY && yp > sweepY - 90) continue
        let dx = 0
        let dy = 0
        if (hot) {
          const ddx = (cx + 0.5) * cell - lx
          const ddy = yp - ly
          const d = Math.sqrt(ddx * ddx + ddy * ddy)
          if (d < R) {
            const k = heat * (1 - d / R)
            const r1 = whfHash(i, bucket)
            const r2 = whfHash(i + 7919, bucket)
            if (r1 < 0.1 * k) continue
            dx = Math.round((r1 * 2 - 1) * 2.4 * k)
            dy = Math.round((r2 * 2 - 1) * 1.6 * k)
          }
        }
        if (blink > 0 && whfHash(i, bucket) < blink) continue
        if (dx || dy) {
          wctx.globalAlpha = 0.22
          wctx.fillRect(m + cx * cell, m + cy * cell, cell, cell)
          wctx.globalAlpha = 1
        }
        wctx.fillRect(m + (cx + dx) * cell, m + (cy + dy) * cell, cell, cell)
      }
      if (sweepY > -1e3) {
        const b = blocks[4]
        for (let i = 0; i < b.length; i += 2) {
          const yp = (b[i + 1] + 0.5) * 4 * cell
          if (yp < sweepY && yp > sweepY - 90) wctx.fillRect(m + b[i] * 4 * cell, m + b[i + 1] * 4 * cell, 4 * cell, 4 * cell)
        }
      }
    }

    const draw = (now: number) => {
      const t = t0 < 0 ? -1 : reduced ? 1e9 : Math.max(0, now - t0)
      // Heat eases in while the pointer is inside and bleeds out after it leaves.
      const target = inside && opts.current.interactive ? 1 : 0
      const dt = Math.min(0.05, (now - heatAt) / 1000)
      heatAt = now
      heat += (target - heat) * Math.min(1, dt * (target ? 9 : 6))
      if (Math.abs(target - heat) < 0.01) heat = target

      drawDither(now, t)
      drawWord(now, t)

      const sweep = now - sweepAt
      if (sweepLine) {
        if (sweep < 760) {
          const y = (sweep / 760) * h
          sweepLine.setAttribute("y1", String(y))
          sweepLine.setAttribute("y2", String(y))
          sweepLine.setAttribute("opacity", String(0.9 * (1 - sweep / 760)))
        } else sweepLine.setAttribute("opacity", "0")
      }
      const entering = t >= 0 && t < 1200
      awake = entering || heat > 0 || sweep < 760 || (inside && !reduced)
    }

    // The frame's own timestamp can predate a start recorded moments earlier
    // in another task, so the clock is read here instead.
    const loop = () => {
      raf = 0
      if (!visible || !alive) return
      draw(now0())
      if (awake) raf = requestAnimationFrame(loop)
    }
    const wake = () => {
      awake = true
      if (!raf && visible && alive) raf = requestAnimationFrame(loop)
    }

    const toLocal = (e: PointerEv) => {
      const b = root.getBoundingClientRect()
      return [e.clientX - b.left, e.clientY - b.top]
    }
    const onMove = (e: PointerEv) => {
      if (!opts.current.interactive) return
      const p = toLocal(e)
      px = p[0]
      py = p[1]
      inside = true
      if (ret) {
        ret.setAttribute("opacity", "1")
        if (retH) retH.setAttribute("transform", "translate(0 " + py.toFixed(1) + ")")
        if (retV) retV.setAttribute("transform", "translate(" + px.toFixed(1) + " 0)")
        if (retC) retC.setAttribute("transform", "translate(" + px.toFixed(1) + " " + py.toFixed(1) + ")")
        if (retT) {
          const right = px > w - 90
          retT.setAttribute("transform", "translate(" + (px + (right ? -14 : 14)).toFixed(1) + " " + (py - 10).toFixed(1) + ")")
          retT.setAttribute("text-anchor", right ? "end" : "start")
          retT.textContent = whfCoord(px, py, w, h) + " · " + String(Math.round(px)).padStart(4, "0") + "," + String(Math.round(py)).padStart(4, "0")
        }
      }
      wake()
    }
    const onLeave = () => {
      inside = false
      if (ret) ret.setAttribute("opacity", "0")
      wake()
    }
    const onDown = (e: PointerEv) => {
      if (!opts.current.interactive || reduced) return
      if ((e.target as HTMLElement).closest("a,button")) return
      sweepAt = now0()
      wake()
    }

    layout()
    heatAt = now0()
    draw(now0())
    wake()

    root.addEventListener("pointermove", onMove)
    root.addEventListener("pointerleave", onLeave)
    root.addEventListener("pointerdown", onDown)
    const ro = new ResizeObserver(() => {
      layout()
      wake()
    })
    ro.observe(root)
    const io = new IntersectionObserver(
      (entries) => {
        const en = entries[0]
        visible = en ? en.isIntersecting : true
        if (visible) {
          if (t0 < 0 && en && en.intersectionRatio >= 0.28) {
            t0 = now0()
            root.classList.add("is-in")
          }
          wake()
        }
      },
      { threshold: [0, 0.28, 0.6] },
    )
    io.observe(root)
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!alive) return
        layout()
        wake()
      })
    }

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerleave", onLeave)
      root.removeEventListener("pointerdown", onDown)
      root.classList.remove("is-in")
    }
  }, [key])

  const toTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const tickLabels = ["A1", "B2", "C3", "D4", "E5", "F6"]

  return (
    <footer
      ref={rootRef}
      className={"whf-root " + className}
      style={
        {
          height,
          "--whf-bg": colors.background,
          "--whf-ink": colors.ink,
          "--whf-font": fontFamily,
          "--whf-mono": monoFamily,
        } as React.CSSProperties
      }
    >
      <style>{WHF_CSS}</style>
      <div className="whf-picture" ref={pictureRef} aria-hidden="true">
        <img src={image.src} alt="" draggable={false} style={{ objectPosition: image.position || "50% 26%" }} />
        <div className="whf-tint" />
        <canvas className="whf-dither" ref={ditherRef} />
        {image.cutout ? (
          <img className="whf-cutout" src={image.cutout} alt="" draggable={false} style={{ objectPosition: image.position || "50% 26%" }} />
        ) : null}
      </div>
      <canvas className="whf-grain" ref={grainRef} aria-hidden="true" />
      <svg className="whf-marks" ref={marksRef} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1">
        <circle className="whf-ca whf-fade" strokeDasharray="1.5 5" opacity=".55" style={{ "--d": ".2s" } as React.CSSProperties} />
        <circle className="whf-cb whf-fade" strokeDasharray="1.5 5" opacity=".55" style={{ "--d": ".5s" } as React.CSSProperties} />
        <g className="whf-gl whf-fade" style={{ "--d": ".7s" } as React.CSSProperties}>
          <line strokeDasharray="1 3" />
          <rect width="3" height="3" fill="currentColor" stroke="none" />
        </g>
        <g className="whf-gr whf-fade" style={{ "--d": ".9s" } as React.CSSProperties}>
          <line strokeDasharray="1 3" />
          <rect width="3" height="3" fill="currentColor" stroke="none" />
        </g>
        <g className="whf-tick whf-fade" style={{ "--d": "1.1s" } as React.CSSProperties}>
          {tickLabels.map((l) => (
            <g key={l}>
              <line x1="0" y1="-4" x2="0" y2="0" />
              <text x="5" y="-1">{l}</text>
            </g>
          ))}
        </g>
        <line className="whf-sl" opacity="0" />
        <g className="whf-ret" opacity="0">
          <line className="whf-rh" y1="0" y2="0" strokeDasharray="1 3" opacity=".6" />
          <line className="whf-rv" x1="0" x2="0" strokeDasharray="1 3" opacity=".6" />
          <g className="whf-rc">
            <circle r="7" />
            <line x1="-11" x2="-7" y1="0" y2="0" />
            <line x1="7" x2="11" y1="0" y2="0" />
            <line y1="-11" y2="-7" x1="0" x2="0" />
            <line y1="7" y2="11" x1="0" x2="0" />
          </g>
          <text className="whf-rt" />
        </g>
      </svg>
      <canvas className="whf-word" ref={wordRef} aria-hidden="true" />
      <svg className="whf-swash" ref={swashRef} aria-hidden="true">
        <path className="whf-cut" pathLength={1} />
        <path className="whf-pen" pathLength={1} transform="translate(1.6 -1.6)" />
        <path className="whf-pen" pathLength={1} transform="translate(0.8 -0.8)" />
        <path className="whf-pen" pathLength={1} />
      </svg>
      <span className="whf-sr">{wordmark}</span>
      {tagline ? (
        <p className="whf-vert whf-l whf-wipe" style={{ "--d": ".6s" } as React.CSSProperties}>
          <span>{tagline}</span>
        </p>
      ) : null}
      {sideNote ? (
        <p className="whf-vert whf-r whf-wipe" style={{ "--d": ".8s" } as React.CSSProperties}>
          <span>{sideNote}</span>
        </p>
      ) : null}
      <div className="whf-foot" ref={footRef}>
        {columns.map((col, i) => (
          <nav className="whf-col whf-wipe" key={col.title} aria-label={col.title} style={{ "--d": 0.5 + i * 0.08 + "s" } as React.CSSProperties}>
            <h3>{col.title}</h3>
            <ul>
              {col.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href || "#"}>{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        {backToTop ? (
          <button type="button" className="whf-up whf-wipe" onClick={toTop} style={{ "--d": ".9s" } as React.CSSProperties}>
            Back to top
          </button>
        ) : (
          <span />
        )}
        <div className="whf-legal whf-wipe" style={{ "--d": "1s" } as React.CSSProperties}>
          <div className="whf-sig">
            {sigils ? (
              <>
                <svg viewBox="-8 -8 16 16" aria-hidden="true">
                  {Array.from({ length: 12 }, (_, i) => {
                    const a = (i / 12) * Math.PI * 2
                    return <line key={i} x1={(Math.cos(a) * 2.2).toFixed(2)} y1={(Math.sin(a) * 2.2).toFixed(2)} x2={(Math.cos(a) * 7).toFixed(2)} y2={(Math.sin(a) * 7).toFixed(2)} />
                  })}
                </svg>
                <svg viewBox="-8 -8 16 16" aria-hidden="true">
                  <circle r="6.8" strokeDasharray="1 2.2" />
                  <path d="M 0 -4.6 A 4.6 4.6 0 1 1 -4.6 0 A 2.6 2.6 0 1 0 0 -2.6 A 1.2 1.2 0 1 1 -1.2 0" />
                </svg>
              </>
            ) : null}
            <span>{legal}</span>
          </div>
          <p>{colophon}</p>
        </div>
      </div>
    </footer>
  )
}

type PointerEv = PointerEvent
