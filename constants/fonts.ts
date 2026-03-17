export const FONT_FAMILIES = {
  INSTRUMENT_SANS: {
    REGULAR: 'InstrumentSans-Regular',
    MEDIUM: 'InstrumentSans-Medium',
    SEMIBOLD: 'InstrumentSans-SemiBold',
    BOLD: 'InstrumentSans-Bold',
  },
} as const;

export const FONT_FILES = {
  [FONT_FAMILIES.INSTRUMENT_SANS.REGULAR]: require('../assets/fonts/InstrumentSans-Regular.ttf'),
  [FONT_FAMILIES.INSTRUMENT_SANS.MEDIUM]: require('../assets/fonts/InstrumentSans-Medium.ttf'),
  [FONT_FAMILIES.INSTRUMENT_SANS.SEMIBOLD]: require('../assets/fonts/InstrumentSans-SemiBold.ttf'),
  [FONT_FAMILIES.INSTRUMENT_SANS.BOLD]: require('../assets/fonts/InstrumentSans-Bold.ttf'),
} as const;

export const FONT_PRESETS = {
  DISPLAY: FONT_FAMILIES.INSTRUMENT_SANS.BOLD,
  HEADLINE: FONT_FAMILIES.INSTRUMENT_SANS.BOLD,
  HEADLINE2: FONT_FAMILIES.INSTRUMENT_SANS.SEMIBOLD,
  SUBTITLE: FONT_FAMILIES.INSTRUMENT_SANS.SEMIBOLD,
  BODY: FONT_FAMILIES.INSTRUMENT_SANS.REGULAR,
  CAPTION: FONT_FAMILIES.INSTRUMENT_SANS.REGULAR,
  BUTTON: FONT_FAMILIES.INSTRUMENT_SANS.SEMIBOLD,
  NUMERIC: FONT_FAMILIES.INSTRUMENT_SANS.MEDIUM,
} as const;

export const FontHelpers = {
  getAllFontNames: () => Object.values(FONT_FAMILIES.INSTRUMENT_SANS),
};
