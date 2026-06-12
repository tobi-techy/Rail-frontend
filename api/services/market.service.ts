import apiClient from '../client';
import type {
  MarketBarsQueryParams,
  MarketBarsResponse,
  MarketExploreQueryParams,
  MarketExploreResponse,
  MarketFilterMetadataResponse,
  MarketInstrumentDetailsResponse,
  MarketNewsFeedResponse,
  MarketNewsQueryParams,
} from '../types/market';

const MARKET_ENDPOINTS = {
  EXPLORE: '/v1/market/explore',
  INSTRUMENT: '/v1/market/instruments/:symbol',
  BARS: '/v1/market/bars/:symbol',
  FILTERS: '/v1/market/filters',
  NEWS_FEED: '/v1/market/news',
} as const;

const toCsv = (values?: string[]): string | undefined => {
  if (!values || values.length === 0) return undefined;
  const cleaned = values.map((v) => v.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned.join(',') : undefined;
};

const omitUndefined = (
  params: Record<string, string | number | boolean | undefined>
): Record<string, string | number | boolean> =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined)) as Record<
    string,
    string | number | boolean
  >;

const normalizeSymbol = (symbol: string): string => symbol.trim().toUpperCase();
const encodeSymbol = (symbol: string): string => encodeURIComponent(normalizeSymbol(symbol));

export const marketService = {
  async getExplore(params?: MarketExploreQueryParams): Promise<MarketExploreResponse> {
    const requestParams = omitUndefined({
      q: params?.q?.trim() || undefined,
      types: toCsv(params?.types),
      exchanges: toCsv(params?.exchanges),
      categories: toCsv(params?.categories),
      tradable: params?.tradable,
      fractionable: params?.fractionable,
      marginable: params?.marginable,
      shortable: params?.shortable,
      min_price: params?.min_price,
      max_price: params?.max_price,
      min_change_pct: params?.min_change_pct,
      max_change_pct: params?.max_change_pct,
      sort_by: params?.sort_by,
      sort_order: params?.sort_order,
      page: params?.page,
      page_size: params?.page_size,
    });

    return apiClient.get<MarketExploreResponse>(MARKET_ENDPOINTS.EXPLORE, {
      params: requestParams,
    });
  },

  async getFilters(): Promise<MarketFilterMetadataResponse> {
    return apiClient.get<MarketFilterMetadataResponse>(MARKET_ENDPOINTS.FILTERS);
  },

  async getInstrument(
    symbol: string,
    options?: {
      includeBars?: boolean;
      barsTimeframe?: string;
      barsLimit?: number;
    }
  ): Promise<MarketInstrumentDetailsResponse> {
    const endpoint = MARKET_ENDPOINTS.INSTRUMENT.replace(':symbol', encodeSymbol(symbol));
    const include = options?.includeBars ? 'bars' : undefined;
    const requestParams = omitUndefined({
      include,
      bars_timeframe: options?.barsTimeframe,
      bars_limit: options?.barsLimit,
    });

    return apiClient.get<MarketInstrumentDetailsResponse>(endpoint, { params: requestParams });
  },

  async getBars(symbol: string, params?: MarketBarsQueryParams): Promise<MarketBarsResponse> {
    const endpoint = MARKET_ENDPOINTS.BARS.replace(':symbol', encodeSymbol(symbol));
    const requestParams = omitUndefined({
      timeframe: params?.timeframe,
      start: params?.start,
      end: params?.end,
    });

    return apiClient.get<MarketBarsResponse>(endpoint, { params: requestParams });
  },

  async getNewsFeed(limit = 5): Promise<MarketNewsFeedResponse> {
    return marketService.getNews({
      limit,
    });
  },

  async getNews(params?: MarketNewsQueryParams): Promise<MarketNewsFeedResponse> {
    const requestParams = omitUndefined({
      limit: params?.limit,
      symbols: toCsv(params?.symbols),
      page_token: params?.page_token,
      include_content: params?.include_content,
    });

    return apiClient.get<MarketNewsFeedResponse>(MARKET_ENDPOINTS.NEWS_FEED, {
      params: requestParams,
    });
  },

  async getPopularInstruments(symbols: string[]): Promise<MarketInstrumentDetailsResponse[]> {
    if (!symbols.length) return [];
    const uniqueSymbols = Array.from(
      new Set(
        symbols.map((symbol) => normalizeSymbol(symbol)).filter((symbol) => symbol.length > 0)
      )
    );
    if (!uniqueSymbols.length) return [];
    const instruments = await Promise.all(
      uniqueSymbols.map((symbol) =>
        marketService
          .getInstrument(symbol)
          .then((result) => result)
          .catch(() => null)
      )
    );
    return instruments.filter(Boolean) as MarketInstrumentDetailsResponse[];
  },
};

export default marketService;
