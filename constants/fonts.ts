/**
 * Fonts Configuration - RAIL Design System v2.0.0
 * Single family: SF Pro Rounded — weight creates hierarchy, not font switching.
 */

export const FONT_FAMILIES = {
  SF_PRO_ROUNDED: {
    LIGHT: 'SF-Pro-Rounded-Light',
    REGULAR: 'SF-Pro-Rounded-Regular',
    MEDIUM: 'SF-Pro-Rounded-Medium',
    SEMIBOLD: 'SF-Pro-Rounded-Semibold',
    BOLD: 'SF-Pro-Rounded-Bold',
  },
} as const;

export const FONT_FILES = {
  [FONT_FAMILIES.SF_PRO_ROUNDED.LIGHT]: require('../assets/fonts/SF-Pro-Rounded-Light.otf'),
  [FONT_FAMILIES.SF_PRO_ROUNDED.REGULAR]: require('../assets/fonts/SF-Pro-Rounded-Regular.otf'),
  [FONT_FAMILIES.SF_PRO_ROUNDED.MEDIUM]: require('../assets/fonts/SF-Pro-Rounded-Medium.otf'),
  [FONT_FAMILIES.SF_PRO_ROUNDED.SEMIBOLD]: require('../assets/fonts/SF-Pro-Rounded-Semibold.otf'),
  [FONT_FAMILIES.SF_PRO_ROUNDED.BOLD]: require('../assets/fonts/SF-Pro-Rounded-Bold.otf'),
} as const;

export const FONT_PRESETS = {
  DISPLAY: FONT_FAMILIES.SF_PRO_ROUNDED.BOLD,
  HEADLINE: FONT_FAMILIES.SF_PRO_ROUNDED.BOLD,
  HEADLINE2: FONT_FAMILIES.SF_PRO_ROUNDED.SEMIBOLD,
  SUBTITLE: FONT_FAMILIES.SF_PRO_ROUNDED.MEDIUM,
  BODY: FONT_FAMILIES.SF_PRO_ROUNDED.REGULAR,
  CAPTION: FONT_FAMILIES.SF_PRO_ROUNDED.REGULAR,
  BUTTON: FONT_FAMILIES.SF_PRO_ROUNDED.SEMIBOLD,
  NUMERIC: FONT_FAMILIES.SF_PRO_ROUNDED.REGULAR,
} as const;

export const FontHelpers = {
  getAllFontNames: () => Object.values(FONT_FAMILIES.SF_PRO_ROUNDED),
};
