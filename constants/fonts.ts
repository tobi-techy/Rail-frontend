export const FONT_FAMILIES = {
  SATOSHI: {
    LIGHT: 'Satoshi-Light',
    REGULAR: 'Satoshi-Regular',
    MEDIUM: 'Satoshi-Medium',
    BOLD: 'Satoshi-Bold',
    BLACK: 'Satoshi-Black',
  },
  MONO: {
    LIGHT: 'CommitMono-350',
    REGULAR: 'CommitMono',
    BOOK: 'CommitMono-450',
    MEDIUM: 'CommitMono-500',
    STRONG: 'CommitMono-550',
    SEMIBOLD: 'CommitMono-600',
    HEAVY: 'CommitMono-625',
    BOLD: 'CommitMono-700',
  },
} as const;

export const FONT_FILES = {
  [FONT_FAMILIES.SATOSHI.LIGHT]: require('../assets/fonts/Satoshi-Light.otf'),
  [FONT_FAMILIES.SATOSHI.REGULAR]: require('../assets/fonts/Satoshi-Regular.otf'),
  [FONT_FAMILIES.SATOSHI.MEDIUM]: require('../assets/fonts/Satoshi-Medium.otf'),
  [FONT_FAMILIES.SATOSHI.BOLD]: require('../assets/fonts/Satoshi-Bold.otf'),
  [FONT_FAMILIES.SATOSHI.BLACK]: require('../assets/fonts/Satoshi-Black.otf'),
  [FONT_FAMILIES.MONO.LIGHT]: require('../assets/fonts/CommitMono-350-Regular.otf'),
  [FONT_FAMILIES.MONO.REGULAR]: require('../assets/fonts/CommitMono-Regular.ttf'),
  [FONT_FAMILIES.MONO.BOOK]: require('../assets/fonts/CommitMono-450-Regular.otf'),
  [FONT_FAMILIES.MONO.MEDIUM]: require('../assets/fonts/CommitMono-500-Regular.otf'),
  [FONT_FAMILIES.MONO.STRONG]: require('../assets/fonts/CommitMono-550-Regular.otf'),
  [FONT_FAMILIES.MONO.SEMIBOLD]: require('../assets/fonts/CommitMono-600-Regular.otf'),
  [FONT_FAMILIES.MONO.HEAVY]: require('../assets/fonts/CommitMono-625-Regular.otf'),
  [FONT_FAMILIES.MONO.BOLD]: require('../assets/fonts/CommitMono-700-Regular.otf'),
} as const;

// Satoshi → UI text, headings, buttons, labels. CommitMono → money, codes, ASCII.
export const FONT_PRESETS = {
  DISPLAY: FONT_FAMILIES.SATOSHI.BOLD,
  HEADLINE: FONT_FAMILIES.SATOSHI.BOLD,
  HEADLINE2: FONT_FAMILIES.SATOSHI.MEDIUM,
  SUBTITLE: FONT_FAMILIES.SATOSHI.MEDIUM,
  BODY: FONT_FAMILIES.SATOSHI.REGULAR,
  BODY_MEDIUM: FONT_FAMILIES.SATOSHI.MEDIUM,
  CAPTION: FONT_FAMILIES.SATOSHI.REGULAR,
  BUTTON: FONT_FAMILIES.SATOSHI.MEDIUM,
  NUMERIC: FONT_FAMILIES.MONO.REGULAR,
  NUMERIC_BOLD: FONT_FAMILIES.MONO.BOLD,
  CODE: FONT_FAMILIES.MONO.REGULAR,
} as const;

export const FontHelpers = {
  getAllFontNames: () => [
    ...Object.values(FONT_FAMILIES.SATOSHI),
    ...Object.values(FONT_FAMILIES.MONO),
  ],
};
