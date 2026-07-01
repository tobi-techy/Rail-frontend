import { createAvatar } from '@dicebear/core';
import { thumbs } from '@dicebear/collection';

/**
 * Generates a deterministic DiceBear SVG string from a seed.
 * Uses the "adventurer-neutral" style for unique, character-based avatars.
 */
export function getAvatarSvg(seed: string, size = 128): string {
  return createAvatar(thumbs, {
    seed,
    size,
    backgroundColor: ['000000'],
    randomizeIds: true,
  }).toString();
}
