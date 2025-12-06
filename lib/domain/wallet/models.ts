export interface Token {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  priceChange: number;
  network: string;
  icon: string;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'deposit' | 'withdraw';
  token: Token;
  amount: string;
  usdAmount: string;
  from?: string;
  to?: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
  fee?: string;
}

export interface Network {
  id: string;
  name: string;
  symbol: string;
  icon: string;
}

export interface TransferRequest {
  toAddress: string;
  tokenId: string;
  amount: string;
  network: string;
}
