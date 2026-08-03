---
name: audit-flow
description: Audit a UI flow end-to-end for design and UX quality. Use when asked to audit, review, or polish a screen flow (e.g. "audit the naira funding flow", "review the withdrawal UI"). Checks motion, layout stability, color tokens, accessibility, and flow gaps against the Rail design system.
---

Audit the flow named in $ARGUMENTS. Report findings — do not fix anything unless explicitly asked.

## Steps

1. Read `DESIGN.md` first — it is the source of truth for palette, typography, motion, and imagery rules.
2. Map the full flow: entry point → every screen → terminal state. Find the routes in `app/` and read each screen, plus the shared primitives it uses (`components/ui/`, `components/withdraw/shared/`, `components/molecules/`).
3. Check each screen against these categories:

**Motion**

- Enter animations ≤300ms, correct direction (bottom UI rises from below — beware Reanimated `SlideInUp`, which enters from the top of the _screen_)
- No element animated by two systems at once (entering prop + shared-value style)
- Everything that animates in has a faster exit; exits never just vanish
- Stagger gaps 30–80ms; primary actions never delayed >300ms
- `useReducedMotion` gates confetti, shakes, and cross-screen movement

**Layout stability**

- Conditional text/pills/status rows reserve fixed-height slots — nothing shoves the keypad or CTA mid-interaction
- Dynamic numbers use `tabular-nums`; rate/quote rows render `—` placeholders instead of inserting later

**Color tokens**

- Compare every hardcoded hex against DESIGN.md; flag drift (multiple greens/oranges/reds for the same semantic state). Errors are coral red `#ff2b3a`, never orange.

**State & flow gaps**

- Dead ends: disabled buttons with no visible reason (CTA label should carry the blocking reason)
- Back navigation preserves typed state (`push` vs `replace`)
- Controls that collect input the API never receives
- Unreachable info (e.g. transfer details lost after leaving a screen)
- Loading skeletons and empty states for every async list

**Micro-interactions & a11y**

- Haptics on success/failure/blocked input; scale-on-press on tappables
- Hit areas ≥40×40px (check `hitSlop` on small icons)
- Icon state changes cross-fade (opacity + scale 0.25→1), never hard-swap
- `accessibilityLabel` on icon-only buttons; no leaked identifier names in labels

4. Output findings grouped by category as markdown tables with **Before | After | Why** columns, each row citing `file:line`. Rank severity within each table.
5. End with a "fix these five first" list — the findings users actually hit, not the compounding polish.
