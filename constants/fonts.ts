/**
 * Fonts Configuration
 *
 * This file manages all custom fonts used in the application.
 * It provides TypeScript types and mappings for safe font usage.
 */

export const FONT_FAMILIES = {
  // PramukhRounded font family (primary font)
  PRAMUKH_ROUNDED: {
    EXTRALIGHT: 'PramukhRounded-Extralight',
    LIGHT: 'PramukhRounded-Light',
    SEMILIGHT: 'PramukhRounded-Semilight',
    REGULAR: 'PramukhRounded-Regular',
    SEMIBOLD: 'PramukhRounded-Semibold',
    BOLD: 'PramukhRounded-Bold',
    EXTRABOLD: 'PramukhRounded-Extrabold',
    BLACK: 'PramukhRounded-Black',
  },
} as const;

/**
 * Font weight mappings for better semantic usage
 */
export const FONT_WEIGHTS = {
  PRAMUKH_ROUNDED: {
    100: FONT_FAMILIES.PRAMUKH_ROUNDED.EXTRALIGHT,
    200: FONT_FAMILIES.PRAMUKH_ROUNDED.EXTRALIGHT,
    300: FONT_FAMILIES.PRAMUKH_ROUNDED.LIGHT,
    350: FONT_FAMILIES.PRAMUKH_ROUNDED.SEMILIGHT,
    400: FONT_FAMILIES.PRAMUKH_ROUNDED.REGULAR,
    500: FONT_FAMILIES.PRAMUKH_ROUNDED.REGULAR,
    600: FONT_FAMILIES.PRAMUKH_ROUNDED.SEMIBOLD,
    700: FONT_FAMILIES.PRAMUKH_ROUNDED.BOLD,
    800: FONT_FAMILIES.PRAMUKH_ROUNDED.EXTRABOLD,
    900: FONT_FAMILIES.PRAMUKH_ROUNDED.BLACK,
  },
} as const;

/**
 * Font file paths for dynamic loading
 */
export const FONT_FILES = {
  [FONT_FAMILIES.PRAMUKH_ROUNDED.EXTRALIGHT]: require('../assets/fonts/PramukhRounded-Extralight.otf'),
  [FONT_FAMILIES.PRAMUKH_ROUNDED.LIGHT]: require('../assets/fonts/PramukhRounded-Light.otf'),
  [FONT_FAMILIES.PRAMUKH_ROUNDED.SEMILIGHT]: require('../assets/fonts/PramukhRounded-Semilight.otf'),
  [FONT_FAMILIES.PRAMUKH_ROUNDED.REGULAR]: require('../assets/fonts/PramukhRounded-Regular.otf'),
  [FONT_FAMILIES.PRAMUKH_ROUNDED.SEMIBOLD]: require('../assets/fonts/PramukhRounded-Semibold.otf'),
  [FONT_FAMILIES.PRAMUKH_ROUNDED.BOLD]: require('../assets/fonts/PramukhRounded-Bold.otf'),
  [FONT_FAMILIES.PRAMUKH_ROUNDED.EXTRABOLD]: require('../assets/fonts/PramukhRounded-Extrabold.otf'),
  [FONT_FAMILIES.PRAMUKH_ROUNDED.BLACK]: require('../assets/fonts/PramukhRounded-Black.otf'),
} as const;

/**
 * TypeScript types for font families
 */
export type PramukhRoundedFontVariant = keyof typeof FONT_FAMILIES.PRAMUKH_ROUNDED;
export type CustomFontFamily = (typeof FONT_FAMILIES.PRAMUKH_ROUNDED)[PramukhRoundedFontVariant];

/**
 * Helper functions for font usage
 */
export const FontHelpers = {
  getPramukhRoundedByWeight: (weight: keyof typeof FONT_WEIGHTS.PRAMUKH_ROUNDED) => {
    return FONT_WEIGHTS.PRAMUKH_ROUNDED[weight];
  },

  getAllFontNames: () => Object.values(FONT_FAMILIES.PRAMUKH_ROUNDED),
};

/**
 * Default font configurations for common use cases
 */
export const FONT_PRESETS = {
  HEADING_PRIMARY: FONT_FAMILIES.PRAMUKH_ROUNDED.BLACK,
  HEADING_SECONDARY: FONT_FAMILIES.PRAMUKH_ROUNDED.BOLD,
  DISPLAY_CREATIVE: FONT_FAMILIES.PRAMUKH_ROUNDED.EXTRABOLD,
  DISPLAY_ARTISTIC: FONT_FAMILIES.PRAMUKH_ROUNDED.BLACK,
  BODY_TEXT: FONT_FAMILIES.PRAMUKH_ROUNDED.REGULAR,
  BODY_TEXT_LIGHT: FONT_FAMILIES.PRAMUKH_ROUNDED.LIGHT,
  BODY_TEXT_MEDIUM: FONT_FAMILIES.PRAMUKH_ROUNDED.SEMIBOLD,
  BODY_TEXT_BOLD: FONT_FAMILIES.PRAMUKH_ROUNDED.BOLD,
  CAPTION: FONT_FAMILIES.PRAMUKH_ROUNDED.REGULAR,
} as const;
