// ============= Network Types =============

export interface Network {
  id: string;
  name: string;
  symbol: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  isTestnet: boolean;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface GetNetworksResponse {
  networks: Network[];
}
