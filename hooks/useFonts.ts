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
   * Load fonts function
   */
  const loadFonts = async (): Promise<void> => {
    try {
      setState('loading');
      setError(null);

      // Load all custom fonts
      await Font.loadAsync(FONT_FILES);

      setState('loaded');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred while loading fonts';
      console.error('Font loading error:', errorMessage);
      setError(errorMessage);
      setState('error');
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
