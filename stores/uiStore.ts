import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_USD_BASE_EXCHANGE_RATES,
  migrateLegacyCurrency,
  sanitizeFxRates,
  type FxRates,
} from '@/utils/currency';
import { getBestAvailableFxRates } from '@/utils/currencyRates';

export type Currency = 'USD' | 'EUR';
export type AppTheme = 'system' | 'light' | 'dark';
export type AppLanguage = 'en' | 'fr' | 'es' | 'de';

interface UIState {
  // Balance visibility
  isBalanceVisible: boolean;
  // Currency
  currency: Currency;
  currencyRates: FxRates;
  currencyRatesUpdatedAt: string | null;
  isCurrencyRatesRefreshing: boolean;
  // Preferences
  hapticsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  requireBiometricOnResume: boolean;
  theme: AppTheme;
  language: AppLanguage;
}

interface UIActions {
  toggleBalanceVisibility: () => void;
  setBalanceVisibility: (visible: boolean) => void;
  setCurrency: (currency: Currency) => void;
  setCurrencyRates: (rates: FxRates, updatedAt?: string) => void;
  refreshCurrencyRates: (options?: { forceRefresh?: boolean }) => Promise<void>;
  setHapticsEnabled: (enabled: boolean) => void;
  setPushNotificationsEnabled: (enabled: boolean) => void;
  setEmailNotificationsEnabled: (enabled: boolean) => void;
  setRequireBiometricOnResume: (enabled: boolean) => void;
  setTheme: (theme: AppTheme) => void;
  setLanguage: (language: AppLanguage) => void;
}

const initialState: UIState = {
  isBalanceVisible: true,
  currency: 'USD',
  currencyRates: DEFAULT_USD_BASE_EXCHANGE_RATES,
  currencyRatesUpdatedAt: null,
  isCurrencyRatesRefreshing: false,
  hapticsEnabled: true,
  pushNotificationsEnabled: true,
  emailNotificationsEnabled: true,
  requireBiometricOnResume: false,
  theme: 'system',
  language: 'en',
};

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      ...initialState,
      toggleBalanceVisibility: () =>
        set((state) => ({ isBalanceVisible: !state.isBalanceVisible })),
      setBalanceVisibility: (visible) => set({ isBalanceVisible: visible }),
      setCurrency: (currency) => set({ currency: migrateLegacyCurrency(currency) }),
      setCurrencyRates: (rates, updatedAt = new Date().toISOString()) =>
        set({
          currencyRates: sanitizeFxRates(rates),
          currencyRatesUpdatedAt: updatedAt,
        }),
      refreshCurrencyRates: async (options) => {
        set({ isCurrencyRatesRefreshing: true });
        try {
          const payload = await getBestAvailableFxRates({
            forceRefresh: options?.forceRefresh ?? false,
          });
          set({
            currencyRates: payload.rates,
            currencyRatesUpdatedAt: payload.updatedAt,
          });
        } finally {
          set({ isCurrencyRatesRefreshing: false });
        }
      },
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
      setPushNotificationsEnabled: (enabled) => set({ pushNotificationsEnabled: enabled }),
      setEmailNotificationsEnabled: (enabled) => set({ emailNotificationsEnabled: enabled }),
      setRequireBiometricOnResume: (enabled) => set({ requireBiometricOnResume: enabled }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 5,
      migrate: (persistedState: any, version: number) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return persistedState;
        }

        let migrated = { ...persistedState };

        if (version < 2) {
          const legacyNotificationsEnabled =
            typeof migrated.notificationsEnabled === 'boolean'
              ? migrated.notificationsEnabled
              : true;

          migrated = {
            ...migrated,
            pushNotificationsEnabled:
              typeof migrated.pushNotificationsEnabled === 'boolean'
                ? migrated.pushNotificationsEnabled
                : legacyNotificationsEnabled,
            emailNotificationsEnabled:
              typeof migrated.emailNotificationsEnabled === 'boolean'
                ? migrated.emailNotificationsEnabled
                : legacyNotificationsEnabled,
          };
        }

        if (version < 3) {
          migrated = {
            ...migrated,
            currencyRates: sanitizeFxRates((migrated as any).currencyRates),
            currencyRatesUpdatedAt:
              typeof migrated.currencyRatesUpdatedAt === 'string'
                ? migrated.currencyRatesUpdatedAt
                : null,
            isCurrencyRatesRefreshing: false,
          };
        }

        if (version < 4) {
          migrated = {
            ...migrated,
            currencyRates: sanitizeFxRates((migrated as any).currencyRates),
          };
        }

        if (version < 5) {
          migrated = {
            ...migrated,
            currency: migrateLegacyCurrency((migrated as any).currency),
            currencyRates: sanitizeFxRates((migrated as any).currencyRates),
          };
        }

        return migrated;
      },
    }
  )
);
