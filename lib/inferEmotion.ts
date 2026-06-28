import type { MiriamEmotion } from '@/components/ai/MiriamCharacter';

/**
 * Infers Miriam's facial emotion from the content of her reply so her avatar
 * reacts live to the vibe of what she's saying — proud on a win, side-eye on a
 * questionable spend, etc. Heuristic and fast; defaults to "happy" since Miriam
 * is warm by default.
 */
export function inferEmotion(text: string | undefined): MiriamEmotion {
  if (!text) return 'happy';
  const t = text.toLowerCase();

  // Celebration / wins / hype
  if (
    /\b(congrat|nailed it|let'?s go|proud|milestone|crushed|you did it|amazing|incredible|love this|🔥|🎉)\b/.test(
      t
    ) ||
    t.includes('great job') ||
    t.includes('well done')
  ) {
    return 'happy';
  }

  // Surprise / big reveal
  if (
    /\b(whoa|wow|wait|seriously|can'?t believe|no way|huge|that much|insane)\b/.test(t) ||
    t.includes('?!')
  ) {
    return 'surprised';
  }

  // Playful call-out / sass / roast
  if (
    /\b(again|really\??|side eye|we need to talk|seriously\?|come on|c'?mon|hmm|interesting choice|bestie)\b/.test(
      t
    )
  ) {
    return 'smug';
  }

  // Concern / serious / warning / distress
  if (
    /\b(careful|watch out|warning|low|tight|struggling|sorry|tough|rough|worried|risk|overspend)\b/.test(
      t
    )
  ) {
    return 'nervous';
  }

  // Bad news / loss
  if (/\b(unfortunately|bad news|failed|declined|dropped|lost|down|negative)\b/.test(t)) {
    return 'sad';
  }

  // Thinking / planning / analysis
  if (/\b(let me|looking at|crunching|analy|hmm|consider|planning|the math)\b/.test(t)) {
    return 'thinking';
  }

  return 'happy';
}
