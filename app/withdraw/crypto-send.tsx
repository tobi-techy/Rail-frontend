/**
 * Crypto withdrawal amount entry screen.
 *
 * Why this file exists: expo-router resolves static folders before dynamic
 * segments. The `/withdraw/crypto/` folder (for the confirm screen) shadows
 * `/withdraw/[method]` when navigating with method='crypto'. This dedicated
 * route bypasses the collision.
 */
export { default } from './[method]';
