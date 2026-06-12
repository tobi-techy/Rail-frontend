import { createAvatar } from '@dicebear/core';
import { adventurerNeutral } from '@dicebear/collection';

/**
 * Generates a deterministic DiceBear SVG string from a seed.
 * Uses the "adventurer-neutral" style for unique, character-based avatars.
 */
export function getAvatarSvg(seed: string, size = 128): string {
  return createAvatar(adventurerNeutral, {
    seed,
    size,
    backgroundColor: ['8B4513', 'A0522D', 'D2691E', 'CD853F', 'DEB887'],
    randomizeIds: true,
  }).toString();
}
