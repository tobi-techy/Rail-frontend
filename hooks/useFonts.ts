import { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import { FONT_FILES, FontHelpers } from '../constants/fonts';

/**
 * Font loading states
 */
export type FontLoadingState = 'loading' | 'loaded' | 'error';

/**
 * Font loading result
 */
export interface FontLoadingResult {
  /**
   * Current loading state
   */
  state: FontLoadingState;

  /**
   * Whether fonts are loaded and ready to use
   */
  fontsLoaded: boolean;

  /**
   * Error message if loading failed
   */
  error: string | null;

  /**
   * Function to retry loading fonts
   */
  retryLoading: () => Promise<void>;
}

/**
 * Custom hook for loading and managing fonts
 *
 * This hook handles:
 * - Loading all custom fonts asynchronously
 * - Providing loading states for UI feedback
 * - Error handling with retry functionality
 * - TypeScript safety
 *
 * @returns FontLoadingResult object with loading state and utilities
 */
export const useFonts = (): FontLoadingResult => {
  const [state, setState] = useState<FontLoadingState>('loading');
  const [error, setError] = useState<string | null>(null);

  /**
   * Load fonts function with timeout and retry logic
   */
  const loadFonts = async (): Promise<void> => {
    try {
      setState('loading');
      setError(null);

      // Add timeout to prevent infinite loading
      const fontLoadPromise = Font.loadAsync(FONT_FILES);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Font loading timeout')), 10000);
      });

      await Promise.race([fontLoadPromise, timeoutPromise]);

      const allFontsLoaded = FontValidation.areAllCustomFontsLoaded();
      if (!allFontsLoaded && __DEV__) {
        console.warn('[useFonts] Some fonts may not have loaded properly');
      }

      setState('loaded');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred while loading fonts';
      if (__DEV__) {
        console.error('[useFonts] Font loading error:', errorMessage);
      }
      setError(errorMessage);
      setState('error');

      if (!__DEV__) {
        setTimeout(() => setState('loaded'), 1000);
      }
    }
  };

  /**
   * Retry loading fonts
   */
  const retryLoading = async (): Promise<void> => {
    await loadFonts();
  };

  // Load fonts on mount
  useEffect(() => {
    loadFonts();
  }, []);

  return {
    state,
    fontsLoaded: state === 'loaded',
    error,
    retryLoading,
  };
};

/**
 * Higher-order component factory for font loading
 * This is moved to a separate .tsx file to avoid JSX in .ts files
 *
 * Usage:
 * ```tsx
 * import { withFonts } from '../hooks/withFonts';
 * export default withFonts(MyComponent);
 * ```
 */
export type WithFontsHOC = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => React.FC<P>;

/**
 * Font validation utilities
 */
export const FontValidation = {
  /**
   * Check if a font is loaded
   */
  isFontLoaded: (fontName: string): boolean => {
    return Font.isLoaded(fontName);
  },

  /**
   * Get all loaded fonts
   */
  getLoadedFonts: (): string[] => {
    return FontHelpers.getAllFontNames().filter((fontName) => Font.isLoaded(fontName));
  },

  /**
   * Validate if all custom fonts are loaded
   */
  areAllCustomFontsLoaded: (): boolean => {
    return FontHelpers.getAllFontNames().every((fontName) => Font.isLoaded(fontName));
  },
};
