import type { ComponentType } from 'react';
import type { SvgProps } from 'react-native-svg';

import SolanaLogo from '@/assets/svg/solana.svg';
import CeloLogo from '@/assets/svg/celo.svg';
import MaticLogo from '@/assets/svg/matic.svg';
import BaseLogo from '@/assets/svg/base.svg';
import AvalancheLogo from '@/assets/svg/avalanche.svg';
import Usdc from '@/assets/svg/usdc.svg';
import Usdt from '@/assets/svg/usdt.svg';

type SvgComponent = ComponentType<SvgProps>;

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon?: SvgComponent;
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

// Network definitions
const SOLANA_NETWORK: DepositNetwork = {
  id: 'solana',
  name: 'Solana',
  subtitle: 'Solana Mainnet',
  ticker: 'SOL',
  chainColor: '#0E0E5C',
  textColor: '#F8FAFC',
  address: 'SOLANA_DEPOSIT_ADDRESS_PLACEHOLDER',
  icon: SolanaLogo,
};

const CELO_NETWORK: DepositNetwork = {
  id: 'celo',
  name: 'Celo',
  subtitle: 'Celo Network',
  ticker: 'CELO',
  chainColor: '#35D07F',
  textColor: '#F8FAFC',
  address: 'CELO_DEPOSIT_ADDRESS_PLACEHOLDER',
  icon: CeloLogo,
  highlights: [
    {
      id: 'evm',
      message: 'This address is shared across EVM networks (Polygon, Celo, Base, Avalanche).',
    },
    { id: 'celo-only', message: 'This address only accepts USDC on the Celo network.' },
  ],
};

const POLYGON_NETWORK: DepositNetwork = {
  id: 'polygon',
  name: 'Polygon',
  subtitle: 'Polygon Network',
  ticker: 'MATIC',
  chainColor: '#8247E5',
  textColor: '#F8FAFC',
  address: 'POLYGON_DEPOSIT_ADDRESS_PLACEHOLDER',
  icon: MaticLogo,
  highlights: [
    {
      id: 'evm',
      message: 'This address is shared across EVM networks (Polygon, Celo, Base, Avalanche).',
    },
    { id: 'polygon-only', message: 'This address only accepts USDC on the Polygon network.' },
  ],
};

const BASE_NETWORK: DepositNetwork = {
  id: 'base',
  name: 'Base',
  subtitle: 'Base Network',
  ticker: 'ETH',
  chainColor: '#0052FF',
  textColor: '#F8FAFC',
  address: 'BASE_DEPOSIT_ADDRESS_PLACEHOLDER',
  icon: BaseLogo,
  highlights: [
    {
      id: 'evm',
      message: 'This address is shared across EVM networks (Polygon, Celo, Base, Avalanche).',
    },
    { id: 'base-only', message: 'This address only accepts USDC on the Base network.' },
  ],
};

const AVALANCHE_NETWORK: DepositNetwork = {
  id: 'avalanche',
  name: 'Avalanche',
  subtitle: 'Avalanche Network',
  ticker: 'AVAX',
  chainColor: '#E84142',
  textColor: '#F8FAFC',
  address: 'AVALANCHE_DEPOSIT_ADDRESS_PLACEHOLDER',
  icon: AvalancheLogo,
  highlights: [
    {
      id: 'evm',
      message: 'This address is shared across EVM networks (Polygon, Celo, Base, Avalanche).',
    },
    { id: 'avalanche-only', message: 'This address only accepts USDC on the Avalanche network.' },
  ],
};

export const STABLECOIN_OPTIONS: StablecoinOption[] = [
  {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    description: 'Deposit USD Coin on supported networks',
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
      CELO_NETWORK,
      POLYGON_NETWORK,
      BASE_NETWORK,
      AVALANCHE_NETWORK,
    ],
  },
  {
    id: 'usdt',
    symbol: 'USDT',
    name: 'Tether USD',
    description: 'Deposit Tether USD on supported networks',
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
    id: 'usdc-celo',
    name: 'USDC (Celo)',
    description: 'USD Coin on Celo network',
    iconColor: '#35D07F',
    backgroundColor: '#ECFDF5',
    isAvailable: true,
  },
  {
    id: 'usdc-polygon',
    name: 'USDC (Polygon)',
    description: 'USD Coin on Polygon network',
    iconColor: '#8247E5',
    backgroundColor: '#F9F5FF',
    isAvailable: true,
  },
  {
    id: 'usdc-base',
    name: 'USDC (Base)',
    description: 'USD Coin on Base network',
    iconColor: '#0052FF',
    backgroundColor: '#EFF6FF',
    isAvailable: true,
  },
  {
    id: 'usdc-avalanche',
    name: 'USDC (Avalanche)',
    description: 'USD Coin on Avalanche network',
    iconColor: '#E84142',
    backgroundColor: '#FEF2F2',
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
