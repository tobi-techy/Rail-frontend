import type { ComponentType } from 'react';
import type { SvgProps } from 'react-native-svg';
import type { LucideIcon } from 'lucide-react-native';

import SolanaLogo from '@/assets/svg/solana.svg';
import Usdc from '@/assets/svg/usdc.svg';
import Usdt from '@/assets/svg/usdt.svg';

type SvgComponent = ComponentType<SvgProps>;

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon?: LucideIcon | SvgComponent;
  iconColor?: string;
  backgroundColor?: string;
  badge?: string;
  isAvailable?: boolean;
  onPress?: () => void;
}

export type DepositNetworkHighlight = {
  id: string;
  message: string;
  tone?: 'default' | 'warning';
};

export type DepositNetwork = {
  id: string;
  name: string;
  subtitle: string;
  ticker: string;
  chainColor: string;
  textColor?: string;
  address: string;
  icon: SvgComponent;
  highlights?: DepositNetworkHighlight[];
};

export type StablecoinOption = {
  id: string;
  symbol: string;
  name: string;
  icon: SvgComponent;
  description: string;
  backgroundColor: string;
  textColor: string;
  networks: DepositNetwork[];
};

// Solana network definition (only supported network)
const SOLANA_NETWORK: DepositNetwork = {
  id: 'solana',
  name: 'Solana',
  subtitle: 'Solana Devnet',
  ticker: 'SOL',
  chainColor: '#0E0E5C',
  textColor: '#F8FAFC',
  address: 'SOLANA_DEPOSIT_ADDRESS_PLACEHOLDER',
  icon: SolanaLogo,
};

export const STABLECOIN_OPTIONS: StablecoinOption[] = [
  {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    description: 'Deposit USD Coin on Solana',
    backgroundColor: '#1C4ED8',
    textColor: '#F1F5F9',
    icon: Usdc,
    networks: [
      {
        ...SOLANA_NETWORK,
        highlights: [
          {
            id: 'earn',
            message: 'For each USDC you deposit, you receive 1 digital dollar to invest with.',
          },
          {
            id: 'solana',
            message: 'This address only accepts USDC on the Solana network.',
          },
        ],
      },
    ],
  },
  {
    id: 'usdt',
    symbol: 'USDT',
    name: 'Tether USD',
    description: 'Deposit Tether USD on Solana',
    backgroundColor: '#047857',
    textColor: '#ECFDF5',
    icon: Usdt,
    networks: [SOLANA_NETWORK],
  },
];

export const getStablecoinById = (id?: string) =>
  STABLECOIN_OPTIONS.find((option) => option.id === id);

export const getNetworkForStablecoin = (
  coinId: string | undefined,
  networkId: string | undefined
) => {
  if (!coinId || !networkId) {
    return undefined;
  }

  const coin = getStablecoinById(coinId);
  return coin?.networks.find((network) => network.id === networkId);
};

/**
 * Fiat deposit methods - bank transfers, cards, etc.
 */
export const FIAT_DEPOSIT_METHODS: PaymentMethod[] = [
  {
    id: 'bank-transfer',
    name: 'Bank Transfer',
    description: 'Direct transfer from your US bank account',
    iconColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
    isAvailable: true,
  },
  {
    id: 'apple-pay',
    name: 'Apple Pay',
    description: 'Fast and secure payment via Apple Pay',
    iconColor: '#000000',
    backgroundColor: '#F5F5F5',
    isAvailable: true,
  },
  {
    id: 'google-pay',
    name: 'Google Pay',
    description: 'Fast and secure payment via Google Pay',
    iconColor: '#4285F4',
    backgroundColor: '#F8FBFF',
    isAvailable: true,
  },
  {
    id: 'debit-card',
    name: 'Debit Card',
    description: 'Pay directly with your debit card',
    iconColor: '#8B5CF6',
    backgroundColor: '#FAF5FF',
    isAvailable: true,
  },
  {
    id: 'credit-card',
    name: 'Credit Card',
    description: 'Pay with your credit card',
    iconColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    isAvailable: true,
  },
  {
    id: 'ach-transfer',
    name: 'ACH Transfer',
    description: 'Automated Clearing House transfer',
    iconColor: '#10B981',
    backgroundColor: '#ECFDF5',
    isAvailable: true,
  },
  {
    id: 'wire-transfer',
    name: 'Wire Transfer',
    description: 'Fast international or domestic wire transfer',
    iconColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
    isAvailable: true,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Pay securely using your PayPal account',
    iconColor: '#0070BA',
    backgroundColor: '#F0F8FF',
    isAvailable: true,
  },
];

/**
 * Crypto deposit methods
 */
export const CRYPTO_DEPOSIT_METHODS: PaymentMethod[] = [
  {
    id: 'usdc-solana',
    name: 'USDC (Solana)',
    description: 'USD Coin on Solana network',
    iconColor: '#1C4ED8',
    backgroundColor: '#EFF6FF',
    isAvailable: true,
  },
  {
    id: 'usdt-solana',
    name: 'USDT (Solana)',
    description: 'Tether USD on Solana network',
    iconColor: '#047857',
    backgroundColor: '#ECFDF5',
    isAvailable: true,
  },
  {
    id: 'sol',
    name: 'SOL (Solana)',
    description: 'Native Solana token',
    iconColor: '#9945FF',
    backgroundColor: '#FAF5FF',
    isAvailable: true,
  },
  {
    id: 'usdc-ethereum',
    name: 'USDC (Ethereum)',
    description: 'USD Coin on Ethereum network',
    iconColor: '#627EEA',
    backgroundColor: '#F8FBFF',
    isAvailable: false, // Coming soon
    badge: 'Coming soon',
  },
  {
    id: 'usdt-ethereum',
    name: 'USDT (Ethereum)',
    description: 'Tether USD on Ethereum network',
    iconColor: '#26A17B',
    backgroundColor: '#F0FDF4',
    isAvailable: false,
    badge: 'Coming soon',
  },
  {
    id: 'usdc-polygon',
    name: 'USDC (Polygon)',
    description: 'USD Coin on Polygon network',
    iconColor: '#8247E5',
    backgroundColor: '#F9F5FF',
    isAvailable: false,
    badge: 'Coming soon',
  },
];

/**
 * Withdrawal methods
 */
export const WITHDRAWAL_METHODS: PaymentMethod[] = [
  {
    id: 'bank-transfer',
    name: 'Bank Transfer',
    description: 'Withdraw to your US bank account',
    iconColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
    isAvailable: true,
  },
  {
    id: 'crypto-wallet',
    name: 'Crypto Wallet',
    description: 'Withdraw to any crypto wallet',
    iconColor: '#8B5CF6',
    backgroundColor: '#FAF5FF',
    isAvailable: true,
  },
  {
    id: 'apple-pay',
    name: 'Apple Pay Cash',
    description: 'Withdraw to your Apple Pay Cash',
    iconColor: '#000000',
    backgroundColor: '#F5F5F5',
    isAvailable: true,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Withdraw to your PayPal account',
    iconColor: '#0070BA',
    backgroundColor: '#F0F8FF',
    isAvailable: true,
  },
  {
    id: 'debit-card',
    name: 'Debit Card',
    description: 'Withdraw to your linked debit card',
    iconColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    isAvailable: true,
  },
];
