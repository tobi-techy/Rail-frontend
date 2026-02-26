// ============= Market Explorer Types =============

export type MarketInstrumentType = 'stock' | 'etf' | 'bond' | 'crypto' | 'option';
export type MarketSession = 'pre' | 'regular' | 'post' | 'closed';
export type MarketSortBy = 'symbol' | 'name' | 'price' | 'change_pct' | 'volume';
export type MarketSortOrder = 'asc' | 'desc';

export interface MarketExploreQueryParams {
  q?: string;
  types?: MarketInstrumentType[];
  exchanges?: string[];
  categories?: string[];
  tradable?: boolean;
  fractionable?: boolean;
  marginable?: boolean;
  shortable?: boolean;
  min_price?: number;
  max_price?: number;
  min_change_pct?: number;
  max_change_pct?: number;
  sort_by?: MarketSortBy;
  sort_order?: MarketSortOrder;
  page?: number;
  page_size?: number;
}

export interface MarketTradability {
  tradable: boolean;
  marginable: boolean;
  fractionable: boolean;
  shortable: boolean;
  easy_to_borrow: boolean;
}

export interface MarketInstrumentQuote {
  price: string | number;
  bid: string | number;
  ask: string | number;
  change: string | number;
  change_pct: string | number;
  open: string | number;
  high: string | number;
  low: string | number;
  previous_close: string | number;
  volume: number;
  timestamp: string;
}

export interface MarketInstrumentCard {
  symbol: string;
  name: string;
  description: string;
  instrument_type: MarketInstrumentType;
  asset_class: string;
  exchange: string;
  categories: string[];
  tags: string[];
  tradability: MarketTradability;
  quote: MarketInstrumentQuote;
  market_session: MarketSession;
  logo_url?: string | null;
}

export interface MarketPagination {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface MarketFacetValue {
  value: string;
  count: number;
}

export interface MarketFacets {
  types: MarketFacetValue[];
  exchanges: MarketFacetValue[];
  categories: MarketFacetValue[];
}

export interface MarketExploreResponse {
  items: MarketInstrumentCard[];
  pagination: MarketPagination;
  applied_filters: Required<
    Pick<MarketExploreQueryParams, 'sort_by' | 'sort_order' | 'page' | 'page_size'>
  > &
    MarketExploreQueryParams;
  facets: MarketFacets;
  as_of: string;
}

export interface MarketBar {
  symbol: string;
  open: string | number;
  high: string | number;
  low: string | number;
  close: string | number;
  volume: number;
  timestamp: string;
}

export interface MarketBarsQueryParams {
  timeframe?: string;
  start?: string;
  end?: string;
}

export interface MarketBarsResponse {
  bars: MarketBar[];
}

export interface MarketInstrumentDetailsResponse {
  instrument: MarketInstrumentCard;
  bars?: MarketBar[];
}

export interface MarketFilterMetadataResponse {
  supported_types: string[];
  supported_exchanges: string[];
  supported_categories: string[];
  supported_sort_by: MarketSortBy[];
  supported_sort_order: MarketSortOrder[];
  defaults: MarketExploreQueryParams;
}

export interface MarketNewsItem {
  id: string;
  source: string;
  title: string;
  summary?: string;
  content_preview?: string;
  url: string;
  related_symbols: string[];
  published_at: string;
  image_url?: string | null;
}

export interface MarketNewsQueryParams {
  limit?: number;
  symbols?: string[];
  page_token?: string;
  include_content?: boolean;
}

export interface MarketNewsFeedResponse {
  news: MarketNewsItem[];
  count: number;
  as_of?: string;
  next_page_token?: string;
}
