import type { Token, Transaction } from '@/lib/domain/wallet/models';

export const MOCK_TOKENS: Token[] = [
  {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    balance: 199.9,
    usdValue: 199.9,
    priceChange: -0.01,
    network: 'Solana',
    icon: 'usdc',
  },
  {
    id: 'usdt',
    symbol: 'USDT',
    name: 'Tether',
    balance: 500,
    usdValue: 500,
    priceChange: 0.02,
    network: 'Solana',
    icon: 'usdt',
  },
  {
    id: 'sol',
    symbol: 'SOL',
    name: 'Solana',
    balance: 2.5,
    usdValue: 312.5,
    priceChange: 5.3,
    network: 'Solana',
    icon: 'sol',
  },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'receive',
    token: MOCK_TOKENS[0],
    amount: '50.00 USDC',
    usdAmount: '$50.00',
    from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    timestamp: new Date().toISOString(),
    status: 'completed',
    txHash: '0xabc123',
  },
];
