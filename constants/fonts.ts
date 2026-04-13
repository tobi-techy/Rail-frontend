export const FONT_FAMILIES = {
  SF_PRO_DISPLAY: {
    REGULAR: 'SFProDisplay-Regular',
    MEDIUM: 'SFProDisplay-Medium',
    SEMIBOLD: 'SFProDisplay-Semibold',
    BOLD: 'SFProDisplay-Bold',
  },
  SF_MONO: {
    REGULAR: 'SFMono-Regular',
    MEDIUM: 'SFMono-Medium',
    SEMIBOLD: 'SFMono-Semibold',
    BOLD: 'SFMono-Bold',
  },
} as const;

export const FONT_FILES = {
  [FONT_FAMILIES.SF_PRO_DISPLAY.REGULAR]: require('../assets/fonts/SF-Pro-Display-Regular.otf'),
  [FONT_FAMILIES.SF_PRO_DISPLAY.MEDIUM]: require('../assets/fonts/SF-Pro-Display-Medium.otf'),
  [FONT_FAMILIES.SF_PRO_DISPLAY.SEMIBOLD]: require('../assets/fonts/SF-Pro-Display-Semibold.otf'),
  [FONT_FAMILIES.SF_PRO_DISPLAY.BOLD]: require('../assets/fonts/SF-Pro-Display-Bold.otf'),
  [FONT_FAMILIES.SF_MONO.REGULAR]: require('../assets/fonts/SF-Mono-Regular.otf'),
  [FONT_FAMILIES.SF_MONO.MEDIUM]: require('../assets/fonts/SF-Mono-Medium.otf'),
  [FONT_FAMILIES.SF_MONO.SEMIBOLD]: require('../assets/fonts/SF-Mono-Semibold.otf'),
  [FONT_FAMILIES.SF_MONO.BOLD]: require('../assets/fonts/SF-Mono-Bold.otf'),
} as const;

// SF Pro Display → UI, prose, headings, buttons, labels
// SF Mono → numbers, data, balances, code
export const FONT_PRESETS = {
  DISPLAY: FONT_FAMILIES.SF_PRO_DISPLAY.BOLD,
  HEADLINE: FONT_FAMILIES.SF_PRO_DISPLAY.BOLD,
  HEADLINE2: FONT_FAMILIES.SF_PRO_DISPLAY.SEMIBOLD,
  SUBTITLE: FONT_FAMILIES.SF_PRO_DISPLAY.SEMIBOLD,
  BODY: FONT_FAMILIES.SF_PRO_DISPLAY.REGULAR,
  BODY_MEDIUM: FONT_FAMILIES.SF_PRO_DISPLAY.MEDIUM,
  CAPTION: FONT_FAMILIES.SF_PRO_DISPLAY.REGULAR,
  BUTTON: FONT_FAMILIES.SF_PRO_DISPLAY.SEMIBOLD,
  NUMERIC: FONT_FAMILIES.SF_MONO.MEDIUM,
  NUMERIC_BOLD: FONT_FAMILIES.SF_MONO.BOLD,
  CODE: FONT_FAMILIES.SF_MONO.REGULAR,
} as const;

export const FontHelpers = {
  getAllFontNames: () => [
    ...Object.values(FONT_FAMILIES.SF_PRO_DISPLAY),
    ...Object.values(FONT_FAMILIES.SF_MONO),
  ],
};
