import type { ComponentType } from 'react';
import type { Currency } from '@/stores/uiStore';
import {
  UsdcIcon, UsdtIcon, EurcIcon, PyusdIcon,
  UsdIcon, EurIcon, GbpIcon, NgnIcon, GhsIcon, KesIcon, CadIcon,
} from '@/assets/svg';

export interface CurrencyConfig {
  code: Currency;
  label: string;
  symbol: string;
  type: 'fiat' | 'stablecoin';
  Icon: ComponentType<any>;
}

const CONFIG: Record<Currency, CurrencyConfig> = {
  USD: { code: 'USD', label: 'US Dollar', symbol: '$', type: 'fiat', Icon: UsdIcon },
  EUR: { code: 'EUR', label: 'Euro', symbol: '€', type: 'fiat', Icon: EurIcon },
  GBP: { code: 'GBP', label: 'British Pound', symbol: '£', type: 'fiat', Icon: GbpIcon },
  NGN: { code: 'NGN', label: 'Nigerian Naira', symbol: '₦', type: 'fiat', Icon: NgnIcon },
  GHS: { code: 'GHS', label: 'Ghanaian Cedi', symbol: 'GH₵', type: 'fiat', Icon: GhsIcon },
  KES: { code: 'KES', label: 'Kenyan Shilling', symbol: 'KSh', type: 'fiat', Icon: KesIcon },
  CAD: { code: 'CAD', label: 'Canadian Dollar', symbol: 'CA$', type: 'fiat', Icon: CadIcon },
  USDC: { code: 'USDC', label: 'USD Coin', symbol: 'USDC', type: 'stablecoin', Icon: UsdcIcon },
  USDT: { code: 'USDT', label: 'Tether', symbol: 'USDT', type: 'stablecoin', Icon: UsdtIcon },
  EURC: { code: 'EURC', label: 'Euro Coin', symbol: 'EURC', type: 'stablecoin', Icon: EurcIcon },
  PYUSD: { code: 'PYUSD', label: 'PayPal USD', symbol: 'PYUSD', type: 'stablecoin', Icon: PyusdIcon },
};

const FALLBACK = CONFIG.USDC;

export const getCurrencyConfig = (code?: string | null): CurrencyConfig =>
  CONFIG[code as Currency] ?? FALLBACK;

export const isFiatCurrency = (code?: string | null): boolean =>
  getCurrencyConfig(code).type === 'fiat';

export const isStablecoin = (code?: string | null): boolean =>
  getCurrencyConfig(code).type === 'stablecoin';
