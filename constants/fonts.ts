/**
 * Fonts Configuration - RAIL Design System v1.4.0
 * Headings: Pramukh Rounded (secondary)
 * Body/UI: SF Pro Rounded (primary)
 */

export const FONT_FAMILIES = {
  SF_PRO_ROUNDED: {
    LIGHT: 'SF-Pro-Rounded-Light',
    REGULAR: 'SF-Pro-Rounded-Regular',
    MEDIUM: 'SF-Pro-Rounded-Medium',
    SEMIBOLD: 'SF-Pro-Rounded-Semibold',
    BOLD: 'SF-Pro-Rounded-Bold',
  },
  PRAMUKH_ROUNDED: {
    LIGHT: 'PramukhRounded-Light',
    REGULAR: 'PramukhRounded-Regular',
    SEMIBOLD: 'PramukhRounded-Semibold',
    BOLD: 'PramukhRounded-Bold',
  },
} as const;

export const FONT_FILES = {
  [FONT_FAMILIES.SF_PRO_ROUNDED.LIGHT]: require('../assets/fonts/SF-Pro-Rounded-Light.otf'),
  [FONT_FAMILIES.SF_PRO_ROUNDED.REGULAR]: require('../assets/fonts/SF-Pro-Rounded-Regular.otf'),
  [FONT_FAMILIES.SF_PRO_ROUNDED.MEDIUM]: require('../assets/fonts/SF-Pro-Rounded-Medium.otf'),
  [FONT_FAMILIES.SF_PRO_ROUNDED.SEMIBOLD]: require('../assets/fonts/SF-Pro-Rounded-Semibold.otf'),
  [FONT_FAMILIES.SF_PRO_ROUNDED.BOLD]: require('../assets/fonts/SF-Pro-Rounded-Bold.otf'),
  [FONT_FAMILIES.PRAMUKH_ROUNDED.LIGHT]: require('../assets/fonts/PramukhRounded-Light.otf'),
  [FONT_FAMILIES.PRAMUKH_ROUNDED.REGULAR]: require('../assets/fonts/PramukhRounded-Regular.otf'),
  [FONT_FAMILIES.PRAMUKH_ROUNDED.SEMIBOLD]: require('../assets/fonts/PramukhRounded-Semibold.otf'),
  [FONT_FAMILIES.PRAMUKH_ROUNDED.BOLD]: require('../assets/fonts/PramukhRounded-Bold.otf'),
} as const;

export const FONT_PRESETS = {
  // Headings - Pramukh Rounded
  DISPLAY: FONT_FAMILIES.PRAMUKH_ROUNDED.BOLD,
  HEADLINE: FONT_FAMILIES.PRAMUKH_ROUNDED.BOLD,
  HEADLINE2: FONT_FAMILIES.PRAMUKH_ROUNDED.SEMIBOLD,
  // Body/UI - SF Pro Rounded
  SUBTITLE: FONT_FAMILIES.SF_PRO_ROUNDED.MEDIUM,
  BODY: FONT_FAMILIES.SF_PRO_ROUNDED.REGULAR,
  CAPTION: FONT_FAMILIES.SF_PRO_ROUNDED.REGULAR,
  BUTTON: FONT_FAMILIES.SF_PRO_ROUNDED.SEMIBOLD,
  NUMERIC: FONT_FAMILIES.SF_PRO_ROUNDED.REGULAR,
} as const;

export const FontHelpers = {
  getAllFontNames: () => [
    ...Object.values(FONT_FAMILIES.SF_PRO_ROUNDED),
    ...Object.values(FONT_FAMILIES.PRAMUKH_ROUNDED),
  ],
};
