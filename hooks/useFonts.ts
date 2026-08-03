import { useFonts as useExpoFonts } from 'expo-font';
import { FONT_FILES } from '../constants/fonts';

export interface FontLoadingResult {
  fontsLoaded: boolean;
  error: string | null;
}

/**
 * Thin wrapper around expo-font's useFonts.
 * Loads all Satoshi and CommitMono variants in a single call.
 */
export const useFonts = (): FontLoadingResult => {
  const [loaded, error] = useExpoFonts(FONT_FILES);
  return {
    fontsLoaded: loaded,
    error: error ? error.message : null,
  };
};
