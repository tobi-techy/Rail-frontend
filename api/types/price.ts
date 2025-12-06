// ============= Price Types =============

export interface TokenPrice {
  tokenId: string;
  symbol: string;
  price: string;
  priceChange24h: number;
  marketCap?: string;
  volume24h?: string;
  updatedAt: string;
}

export interface GetPricesRequest {
  tokenIds: string[];
  currency?: string;
}

export interface GetPricesResponse {
  prices: TokenPrice[];
}
