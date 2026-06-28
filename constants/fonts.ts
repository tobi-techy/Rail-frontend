export const FONT_FAMILIES = {
  GEIST: {
    THIN: 'Geist-Thin',
    EXTRA_LIGHT: 'Geist-ExtraLight',
    LIGHT: 'Geist-Light',
    REGULAR: 'Geist-Regular',
    MEDIUM: 'Geist-Medium',
    SEMIBOLD: 'Geist-SemiBold',
    BOLD: 'Geist-Bold',
    BLACK: 'Geist-Black',
  },
} as const;

export const FONT_FILES = {
  [FONT_FAMILIES.GEIST.REGULAR]: require('../assets/fonts/Geist-Regular.ttf'),
  [FONT_FAMILIES.GEIST.MEDIUM]: require('../assets/fonts/Geist-Medium.ttf'),
  [FONT_FAMILIES.GEIST.SEMIBOLD]: require('../assets/fonts/Geist-SemiBold.ttf'),
  [FONT_FAMILIES.GEIST.BOLD]: require('../assets/fonts/Geist-Bold.ttf'),
} as const;

// Geist → all UI text, headings, buttons, labels, numbers
export const FONT_PRESETS = {
  DISPLAY: FONT_FAMILIES.GEIST.BOLD,
  HEADLINE: FONT_FAMILIES.GEIST.BOLD,
  HEADLINE2: FONT_FAMILIES.GEIST.SEMIBOLD,
  SUBTITLE: FONT_FAMILIES.GEIST.SEMIBOLD,
  BODY: FONT_FAMILIES.GEIST.REGULAR,
  BODY_MEDIUM: FONT_FAMILIES.GEIST.MEDIUM,
  CAPTION: FONT_FAMILIES.GEIST.REGULAR,
  BUTTON: FONT_FAMILIES.GEIST.SEMIBOLD,
  NUMERIC: FONT_FAMILIES.GEIST.MEDIUM,
  NUMERIC_BOLD: FONT_FAMILIES.GEIST.BOLD,
  CODE: FONT_FAMILIES.GEIST.REGULAR,
} as const;

export const FontHelpers = {
  getAllFontNames: () => Object.values(FONT_FAMILIES.GEIST),
};
