import { Platform, Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 14 Pro)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

// Solana Seeker: 2670×1200 @ 460ppi → ~6.36" display, ~20:9 aspect
const SEEKER_ASPECT = 2670 / 1200; // ~2.225

const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
const isTallDisplay = aspectRatio > 2.0; // 20:9 or taller (Seeker, modern Android)
const isSmallDevice = SCREEN_WIDTH < 375;

// Scale factors
const widthScale = SCREEN_WIDTH / BASE_WIDTH;
const heightScale = SCREEN_HEIGHT / BASE_HEIGHT;

/**
 * Scale a value based on screen width (for horizontal spacing, font sizes)
 */
export const scale = (size: number): number => {
  const scaled = size * widthScale;
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
};

/**
 * Scale a value based on screen height (for vertical spacing)
 */
export const verticalScale = (size: number): number => {
  const scaled = size * heightScale;
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
};

/**
 * Moderate scale - less aggressive scaling for fonts
 */
export const moderateScale = (size: number, factor = 0.5): number => {
  const scaled = size + (scale(size) - size) * factor;
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
};

/**
 * Layout constants that adapt to device
 */
export const layout = {
  // Screen info
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  isTallDisplay,
  isSmallDevice,

  // Spacing
  screenPadding: scale(24),
  inputGap: verticalScale(16),
  sectionGap: verticalScale(isTallDisplay ? 32 : 24),

  // Title sizing - smaller on tall displays to leave room for content
  titleSize: isTallDisplay ? scale(42) : scale(50),
  subtitleSize: scale(14),

  // Button area
  buttonBottomPadding: verticalScale(isTallDisplay ? 24 : 16),

  // Keyboard behavior
  keyboardBehavior: Platform.OS === 'ios' ? 'padding' : ('height' as const),
  keyboardVerticalOffset: Platform.OS === 'ios' ? 0 : 20,
} as const;

/**
 * Get responsive value based on device type
 */
export const responsive = <T>(options: { default: T; tall?: T; small?: T; android?: T }): T => {
  if (Platform.OS === 'android' && options.android !== undefined) return options.android;
  if (isTallDisplay && options.tall !== undefined) return options.tall;
  if (isSmallDevice && options.small !== undefined) return options.small;
  return options.default;
};
