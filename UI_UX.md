# CellTrace — UI/UX Design Document

## 0. Direction Statement

CellTrace sits at the intersection of two physical-feeling things: a battery cell (real, chemical, tangible) and a ledger (immutable, sequential, trustworthy). The design should feel like **looking inside a living piece of hardware that is also keeping a permanent record of itself** — not a SaaS dashboard, not a crypto-bro gradient page, not another AI-generated landing page with cream backgrounds or a single acid-green accent on black.

**Goal in one line**: it should feel like an instrument panel for something real and slightly alive — cinematic, technical, and *earned* rather than decorated.

## 1. Color Palette

A near-black base with three accents, each carrying a distinct meaning rather than one generic "brand color":

| Name | Hex | Role |
|---|---|---|
| **Graphite** | `#0B0F14` | Primary background — near-black with a cool blue undertone, like a circuit board in low light |
| **Panel** | `#12171D` | Elevated surfaces (cards, panels) — one step up from Graphite |
| **Copper Terminal** | `#C87F4B` | The *physical* accent — battery terminals, hardware, anything tactile/real-world |
| **Signal Teal** | `#3FCDB0` | The *health/data* accent — SOH readouts, healthy states, the pulse of the living cell |
| **Ledger Violet** | `#7B6EF6` | The *blockchain/trust* accent — provenance records, hashes, on-chain confirmations |
| **Rust Amber** | `#D9622B` | Warning/degradation state — low SOH, failed writes, tamper mismatches |
| **Warm White** | `#EDEAE3` | Primary text — slightly warm off-white, not clinical pure white |

Rule of use: Copper never appears in the same component as Violet unless that component is literally the signature 3D cell (where physical + chain meet). Everywhere else, one accent per concern keeps the palette legible instead of decorative.

## 2. Typography

| Role | Face | Notes |
|---|---|---|
| **Display** | Neue Machina (or Cabinet Grotesk as a free alternative) | Technical, industrial, geometric — used large and with restraint, only for hero statements and page titles |
| **Body** | General Sans (or Inter as fallback) | Clean, neutral, highly legible at small sizes for report data and copy |
| **Utility / data** | JetBrains Mono | Reserved for literal data: transaction hashes, wallet addresses, battery IDs, timestamps — the monospace signals "this is a real, unaltered value," not styling |

Type scale is deliberately wide (display headlines at 64–96px on desktop, dropping hard to body at 16px) — the contrast itself communicates "here is the one important number" vs. "here is supporting detail," which matters directly for SOH/RUL readouts.

## 3. Layout Concept

Asymmetric, not centered-card-on-white. The 3D signature element anchors one side of the hero and reappears (smaller, docked) as a persistent health indicator across every page — it's not just a hero decoration, it's a recurring instrument.

```
┌─────────────────────────────────────────────┐
│ [logo]                    [lookup] [login]    │  ← thin nav, Graphite bg
├─────────────────────────────────────────────┤
│  HEADLINE                      ┌───────────┐  │
│  (display, left-aligned,       │  living    │  │
│  max 2 lines)                  │  cell 3D   │  │
│  short supporting line          │  object    │  │
│  [primary CTA]                 └───────────┘  │
├─────────────────────────────────────────────┤
│  data strip: live SOH readout in mono type    │
└─────────────────────────────────────────────┘
```

Report and Dashboard pages drop the asymmetry for a clearer grid (data needs order), but keep the docked mini-cell indicator in a fixed corner, its glow color live-reflecting the current battery's health.

## 4. The Signature Element: "The Living Cell"

A single Three.js object, cross-sectioned to reveal internal layers, rendered in Copper and dark metal tones. Two things make it *meaningful* rather than decorative:

1. **Its glow is real data.** The Signal Teal pulse inside the cell brightens and slows/quickens based on the actual SOH % of whatever battery is currently in view — not a generic ambient animation.
2. **A thin Ledger Violet thread wraps the cell**, tying a small knot (node) each time a new provenance record exists for that battery. Scrub through a battery's history and watch the thread gain knots in real time — this single object visually *is* the product's thesis: a physical thing, permanently and visibly recorded.

This is the one place the design spends its boldness. Everything else stays disciplined around it.

## 5. Motion

- **Page load (Landing only)**: the cell rotates into frame and its first pulse syncs with the headline's fade-in — one orchestrated GSAP timeline, not scattered effects.
- **Scroll**: ScrollTrigger reveals section-by-section down the landing page; the docked mini-cell in the corner stays static once it appears (an instrument, not a decoration that keeps stealing attention).
- **On-chain confirmation**: when a "Log to chain" action confirms, the violet thread visibly ties a new knot on the cell — this is the single most important animated moment in the whole app, because it's the moment trust becomes visible.
- **Restraint**: no parallax-everything, no hover effects on things that aren't interactive. Reduced-motion preference is respected — the cell still shows state, just without the pulse/rotation.

## 6. UI Components

- **Health card** — SOH %, RUL, confidence range, degradation trend sparkline, all in one panel-surface card with a Copper left-border accent.
- **Provenance timeline** — vertical list of on-chain records, each row: timestamp (mono), event type, hash (mono, truncated with copy button), link to block explorer. Violet accent line connecting entries, echoing the cell's thread motif.
- **Verify result banner** — full-width, color-coded: Signal Teal for match, Rust Amber for mismatch, with the two hashes shown side-by-side in mono type so the comparison is visibly literal, not just a claim.
- **Buttons** — solid Copper for primary/physical actions (predict, submit), outlined Violet for chain actions (log to chain, verify), ghost/text for tertiary nav.
- **Empty/error states** — illustrated with a dimmed, static (non-pulsing) version of the cell — visually communicates "no data yet" using the same visual language rather than a generic icon.

## 7. Design Principles

- **Simplicity** — every screen has one primary action; secondary actions are visually quieter, never competing for the same attention as the health readout or the chain confirmation.
- **Consistency** — the three-accent color logic (Copper = physical, Teal = health, Violet = chain) holds everywhere, so a user learns the system's vocabulary within one screen and it never contradicts itself.
- **Usability** — mono type for anything a user might need to copy or verify (hashes, IDs, addresses); real loading and pending states instead of instant fake transitions, since honesty about timing matters for a trust product.
- **Accessibility** — text contrast checked against Graphite/Panel backgrounds (Warm White holds AA+ at body sizes); all interactive elements have visible keyboard focus states in Signal Teal; reduced-motion respected; color is never the only signal (match/mismatch states also use icon + text, not color alone).

## 8. Mood & Feel

Technical, tactile, and quietly confident — like the inside of a well-designed instrument, not a marketing page. Dark but warm (Graphite has a hint of blue, Warm White has a hint of amber — nothing clinical or cold). The 3D cell should feel like it's *actually there*, reacting to real data, not spinning decoratively. The overall impression a first-time visitor should have: "this looks like it's showing me something real," before they've read a single word of copy.
