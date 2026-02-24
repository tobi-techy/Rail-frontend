/**
 * Design tokens from RAIL-DESIGN.json v3.0.0
 * Clean minimal design: Black, White, Rail Red, Rail Green
 */

export const colors = {
  primary: {
    accent: '#FF2E01',
    dark: '#E02900',
    secondary: '#00C853',
    tertiary: '#FF2E01',
  },
  background: {
    main: '#FFFFFF',
    surface: '#F5F5F5',
  },
  text: {
    primary: '#000000',
    secondary: '#757575',
    onPrimary: '#FFFFFF',
  },
  semantic: {
    success: '#00C853',
    destructive: '#FF2E01',
  },
  overlay: 'rgba(0, 0, 0, 0.7)',
} as const;

export const typography = {
  fonts: {
    display: 'PramukhRounded-Bold',
    headline: 'PramukhRounded-Bold',
    headline2: 'PramukhRounded-Semibold',
    subtitle: 'SF-Pro-Rounded-Medium',
    body: 'SF-Pro-Rounded-Regular',
    caption: 'SF-Pro-Rounded-Regular',
    button: 'SF-Pro-Rounded-Semibold',
    numeric: 'SF-Pro-Rounded-Regular',
  },
  styles: {
    displayLarge: { size: 48, weight: 'bold', lineHeight: 1.1 },
    headline1: { size: 32, weight: 'bold', lineHeight: 1.2 },
    headline2: { size: 24, weight: '600', lineHeight: 1.3 },
    subtitle1: { size: 18, weight: '500', lineHeight: 1.4 },
    body1: { size: 16, weight: '400', lineHeight: 1.5 },
    caption: { size: 14, weight: '400', lineHeight: 1.5 },
    buttonLarge: { size: 18, weight: '600', lineHeight: 1.1 },
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  full: 9999,
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

export const components = {
  button: { height: 52, borderRadius: 9999 },
  input: { height: 52, borderRadius: 12 },
  card: { borderRadius: 16, padding: 16 },
  icon: { sizeM: 24, sizeL: 32 },
} as const;

export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  components,
} as const;
