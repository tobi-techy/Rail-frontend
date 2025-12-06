import type { ComponentType } from 'react';
import type { SvgProps } from 'react-native-svg';

import SolanaLogo from '@/assets/svg/solana.svg';
import Usdc from '@/assets/svg/usdc.svg';
import Usdt from '@/assets/svg/usdt.svg';

type SvgComponent = ComponentType<SvgProps>;

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

export const getNetworkForStablecoin = (coinId: string | undefined, networkId: string | undefined) => {
  if (!coinId || !networkId) {
    return undefined;
  }

  const coin = getStablecoinById(coinId);
  return coin?.networks.find((network) => network.id === networkId);
};
