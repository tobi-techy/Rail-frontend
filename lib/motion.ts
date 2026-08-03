import { Easing, Keyframe, ReduceMotion } from 'react-native-reanimated';

/**
 * Shared motion language for the Miriam chat — Emil Kowalski's principles:
 * strong custom easing curves, transform/opacity only, asymmetric enter/exit,
 * and reduced-motion friendliness. Keep all chat timing/curves here so the whole
 * experience stays cohesive.
 */

// ── Easing curves (stronger than the built-in CSS easings) ──────────────────
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1); // entrances / responsive UI
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1); // on-screen movement
export const EASE_DRAWER = Easing.bezier(0.32, 0.72, 0, 1); // iOS drawer feel
export const EASE_GRAVITY = Easing.bezier(0.4, 0.0, 0.8, 1.0); // accelerating fall (confetti)

// ── Spring presets ──────────────────────────────────────────────────────────
export const SPRING_SNAPPY = { damping: 22, stiffness: 320, mass: 0.7 } as const; // crisp, minimal bounce
export const SPRING_BUBBLE = { damping: 19, stiffness: 240, mass: 0.8 } as const; // gentle bubble pop
export const SPRING_PRESS = { damping: 18, stiffness: 320 } as const; // press feedback
export const SPRING_SHEET = { damping: 24, stiffness: 280, mass: 0.9 } as const; // canvas card rise (settled, no overshoot on money UI)

// ── Durations (Emil: UI stays under 300ms) ──────────────────────────────────
export const DUR = {
  press: 140,
  bubble: 260,
  enter: 220,
  exit: 160,
} as const;

/**
 * Bubble entrance: a subtle rise + scale + fade, like an iMessage bubble landing.
 * Honors the system reduced-motion setting (Reanimated drops to the end state).
 */
export function bubbleEnter() {
  return new Keyframe({
    0: { opacity: 0, transform: [{ translateY: 8 }, { scale: 0.96 }] },
    100: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }], easing: EASE_OUT },
  })
    .duration(DUR.bubble)
    .reduceMotion(ReduceMotion.System);
}

/**
 * Canvas card entrance: rise + slight scale + fade — a card landing over the
 * homescreen. Asymmetric with cardExit (exit is faster, just falls + fades).
 */
export function cardEnter() {
  return new Keyframe({
    0: { opacity: 0, transform: [{ translateY: 28 }, { scale: 0.97 }] },
    100: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }], easing: EASE_DRAWER },
  })
    .duration(DUR.enter)
    .reduceMotion(ReduceMotion.System);
}

export function cardExit() {
  return new Keyframe({
    0: { opacity: 1, transform: [{ translateY: 0 }] },
    100: { opacity: 0, transform: [{ translateY: 24 }], easing: EASE_OUT },
  })
    .duration(DUR.exit)
    .reduceMotion(ReduceMotion.System);
}

export { ReduceMotion };
