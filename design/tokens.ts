/**
 * Design tokens extracted from design.json
 * Provides centralized access to colors, typography, spacing, and other design values
 */

/**
 * Color palette based on design.json specifications
 */
export const colors = {
  // Primary colors - updated palette
  primary: {
    magenta: '#FB088F',
    pink: '#F39ABE',
    lavender: '#949FFF',
    dark: '#1E1A3E',
    darkBlue: '#1E1F4B',
  },

  // Accent colors - updated palette
  accent: {
    limeGreen: '#D4FF00',
    softGreen: '#ADF48C',
  },

  // Background colors
  background: {
    main: '#FFFFFF',
    light: '#EAE8FF',
    dark: '#1E1A3E',
  },

  // Surface colors
  surface: {
    card: '#F7F7F7',
    light: '#EAE8FF',
  },

  // Text colors
  text: {
    primary: '#1E1A3E',
    secondary: '#1E1F4B',
    tertiary: '#949FFF',
    onPrimary: '#FFFFFF',
    onAccent: '#1E1A3E',
  },

  // Semantic colors
  semantic: {
    success: '#ADF48C',
    danger: '#FB088F',
    warning: '#D4FF00',
  },

  // Additional utility colors
  border: {
    primary: '#EAE8FF',
    secondary: '#949FFF',
    tertiary: '#F7F7F7',
  },

  overlay: 'rgba(30, 26, 62, 0.5)',
} as const;

/**
 * Typography system based on design.json specifications
 */
export const typography = {
  fonts: {
    primary: 'Boldonse', // For headings and display text
    secondary: 'SF-Pro-Rounded-Regular', // For body text and UI
    // New Tailwind-style font mappings
    display: 'Boldonse-Regular', // For large, impactful text
    heading: 'Boldonse-Regular', // For section headers
    subheading: 'SF-Pro-Rounded-Semibold', // For subsection headers
    body: 'SF-Pro-Rounded-Regular', // Main body text
    'body-bold': 'SF-Pro-Rounded-Bold',
    'body-medium': 'SF-Pro-Rounded-Medium',
    'body-light': 'SF-Pro-Rounded-Light',
  },

  styles: {
    h1: {
      font: 'Boldonse',
      size: 36,
      weight: 'regular',
    },
    h2: {
      font: 'Boldonse',
      size: 24,
      weight: 'regular',
    },
    h3: {
      font: 'Boldonse',
      size: 18,
      weight: 'regular',
    },
    body: {
      font: 'SF-Pro-Rounded-Regular',
      size: 16,
      weight: 'regular',
    },
    label: {
      font: 'SF-Pro-Rounded-Medium',
      size: 12,
      weight: 'medium',
    },
    caption: {
      font: 'SF-Pro-Rounded-Regular',
      size: 12,
      weight: 'regular',
    },
  },

  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

/**
 * Layout system based on design.json specifications
 */
export const layout = {
  containerPadding: 24,
  elementSpacing: 16,
  cornerRadius: 20,
} as const;

/**
 * Spacing system based on 8px grid
 */
export const spacing = {
  xs: 4, // 0.5 * 8px
  sm: 8, // 1 * 8px
  md: 16, // 2 * 8px (elementSpacing from design.json)
  lg: 24, // 3 * 8px (containerPadding from design.json)
  xl: 32, // 4 * 8px
  xxl: 48, // 6 * 8px
  xxxl: 64, // 8 * 8px
} as const;

/**
 * Border radius values based on design.json
 */
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12, // Button corner radius from design.json
  xl: 16, // Quest card corner radius from design.json
  xxl: 20, // Default corner radius from design.json
  modal: 24, // Modal corner radius from design.json
  fab: 28, // FAB corner radius from design.json
  full: 9999,
} as const;

/**
 * Shadow definitions
 */
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

/**
 * Animation durations
 */
export const animations = {
  fast: 150,
  normal: 250,
  slow: 350,
} as const;

/**
 * Breakpoints for responsive design
 */
export const breakpoints = {
  sm: 375, // Small phones
  md: 414, // Large phones
  lg: 768, // Tablets
  xl: 1024, // Large tablets
} as const;

/**
 * Complete design tokens object
 */
export const designTokens = {
  colors,
  typography,
  layout,
  spacing,
  borderRadius,
  shadows,
  animations,
  breakpoints,
} as const;
