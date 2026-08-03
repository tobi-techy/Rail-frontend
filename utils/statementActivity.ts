import { NativeModules, Platform } from 'react-native';

const { StatementActivityModule } = NativeModules;

const isSupported = Platform.OS === 'ios' && !!StatementActivityModule;

export const StatementActivity = {
  /** Start a Live Activity. Returns the activity ID or null if unsupported. */
  start: async (fileName: string, phase: string): Promise<string | null> => {
    if (!isSupported) return null;
    try {
      return await StatementActivityModule.startActivity(fileName, phase);
    } catch {
      return null;
    }
  },

  /** Update phase text and progress (0–1). Pass -1 for indeterminate. */
  update: async (phase: string, progress = -1): Promise<void> => {
    if (!isSupported) return;
    try {
      await StatementActivityModule.updateActivity(phase, progress);
    } catch {
      // Silent — widget update failure should never crash the app
    }
  },

  /** End the activity. Dismisses after 4 seconds. */
  end: async (success: boolean): Promise<void> => {
    if (!isSupported) return;
    try {
      await StatementActivityModule.endActivity(success);
    } catch {}
  },
};
