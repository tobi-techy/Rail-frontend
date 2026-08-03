import { create } from 'zustand';
import type { UIDirective } from '@/api/types/ai';

/**
 * Global sink for Miriam's visual layer. Any Miriam surface (voice client tools,
 * chat tool results, proactive nudges) pushes a UIDirective here and the
 * MiriamCanvasHost renders it as a card over whatever screen is active.
 *
 * A small queue lets rapid directives stack instead of clobbering each other:
 * the visible card stays until dismissed, then the next one rises.
 */

export interface CanvasEntry extends UIDirective {
  id: number;
}

interface MiriamCanvasState {
  current: CanvasEntry | null;
  queue: CanvasEntry[];
  /** Present a directive. Dedupes confirm cards by action_id so a voice + chat
   *  echo of the same pending action doesn't double-stack. */
  present: (directive: UIDirective) => void;
  /** Dismiss the current card and advance to the next queued one. */
  dismiss: () => void;
  /** Drop everything (e.g. on logout / session end). */
  clear: () => void;
}

let entryId = 0;

function sameConfirm(a: UIDirective, b: UIDirective): boolean {
  return (
    a.card === 'confirm' && b.card === 'confirm' && !!a.action_id && a.action_id === b.action_id
  );
}

export const useMiriamCanvasStore = create<MiriamCanvasState>((set, get) => ({
  current: null,
  queue: [],
  present: (directive) => {
    const entry: CanvasEntry = { ...directive, id: ++entryId };
    const { current, queue } = get();

    // Dedupe: ignore a confirm directive that matches what's already shown/queued.
    if (current && sameConfirm(current, directive)) return;
    if (queue.some((q) => sameConfirm(q, directive))) return;

    if (!current) {
      set({ current: entry });
    } else {
      set({ queue: [...queue, entry] });
    }
  },
  dismiss: () => {
    const { queue } = get();
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      set({ current: next, queue: rest });
    } else {
      set({ current: null });
    }
  },
  clear: () => set({ current: null, queue: [] }),
}));

/** Imperative helper for non-React callers (client tools, services). */
export function presentCanvas(directive: UIDirective) {
  useMiriamCanvasStore.getState().present(directive);
}
