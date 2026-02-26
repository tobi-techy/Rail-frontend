import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../queryClient';
import { marketService } from '../services/market.service';
import type {
  MarketBarsQueryParams,
  MarketBarsResponse,
  MarketExploreQueryParams,
  MarketExploreResponse,
  MarketNewsFeedResponse,
  MarketNewsQueryParams,
  MarketSortBy,
  MarketSortOrder,
} from '../types/market';

type MarketExploreBaseFilters = Omit<MarketExploreQueryParams, 'page'>;

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 50;

const normalizePageSize = (value?: number): number => {
  if (!value || value < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(value, MAX_PAGE_SIZE);
};

const normalizeExploreParams = (params?: MarketExploreBaseFilters): MarketExploreBaseFilters => {
  const sortBy: MarketSortBy = params?.sort_by ?? 'symbol';
  const sortOrder: MarketSortOrder = params?.sort_order ?? 'asc';

  return {
    ...params,
    q: params?.q?.trim() || undefined,
    page_size: normalizePageSize(params?.page_size),
    sort_by: sortBy,
    sort_order: sortOrder,
  };
};

export function useMarketFilters() {
  return useQuery({
    queryKey: queryKeys.market.filters(),
    queryFn: () => marketService.getFilters(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMarketExplore(
  params?: MarketExploreBaseFilters,
  options?: {
    enabled?: boolean;
  }
) {
  const normalizedParams = normalizeExploreParams(params);

  return useInfiniteQuery<MarketExploreResponse, Error>({
    queryKey: queryKeys.market.explore(normalizedParams),
    initialPageParam: 1,
    enabled: options?.enabled ?? true,
    placeholderData: (previousData) => previousData,
    queryFn: ({ pageParam }) =>
      marketService.getExplore({
        ...normalizedParams,
        page: Number(pageParam) || 1,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.has_next ? lastPage.pagination.page + 1 : undefined,
    staleTime: 15 * 1000,
  });
}

export function useMarketInstrument(
  symbol?: string | null,
  options?: {
    includeBars?: boolean;
    barsTimeframe?: string;
    barsLimit?: number;
  }
) {
  const normalizedSymbol = symbol?.trim().toUpperCase() || undefined;

  return useQuery({
    queryKey: queryKeys.market.instrument(
      normalizedSymbol ?? '',
      !!options?.includeBars,
      options?.barsTimeframe,
      options?.barsLimit
    ),
    queryFn: () =>
      marketService.getInstrument(normalizedSymbol as string, {
        includeBars: options?.includeBars,
        barsTimeframe: options?.barsTimeframe,
        barsLimit: options?.barsLimit,
      }),
    enabled: !!normalizedSymbol,
    staleTime: 10 * 1000,
  });
}

export function useMarketBars(
  symbol?: string | null,
  params?: MarketBarsQueryParams,
  options?: { enabled?: boolean }
) {
  const normalizedSymbol = symbol?.toUpperCase().trim() || '';

  return useQuery<MarketBarsResponse, Error>({
    queryKey: queryKeys.market.bars(
      normalizedSymbol,
      params?.timeframe,
      params?.start,
      params?.end
    ),
    queryFn: () =>
      marketService.getBars(normalizedSymbol, {
        timeframe: params?.timeframe,
        start: params?.start,
        end: params?.end,
      }),
    enabled: (options?.enabled ?? true) && Boolean(normalizedSymbol),
    placeholderData: (previousData) => previousData,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 45 * 1000,
  });
}

export function useMarketNews(limit = 5) {
  return useQuery({
    queryKey: queryKeys.news.marketFeed({ limit }),
    queryFn: () => marketService.getNewsFeed(limit),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}

export function useMarketNewsFeed(
  params?: Omit<MarketNewsQueryParams, 'page_token'>,
  options?: { enabled?: boolean }
) {
  const normalized = {
    limit: params?.limit ?? 5,
    symbols: params?.symbols?.map((s) => s.toUpperCase().trim()).filter(Boolean),
    include_content: params?.include_content,
  };

  return useInfiniteQuery<MarketNewsFeedResponse, Error>({
    queryKey: queryKeys.news.marketFeed(normalized),
    initialPageParam: '',
    enabled: options?.enabled ?? true,
    placeholderData: (previousData) => previousData,
    queryFn: ({ pageParam }) =>
      marketService.getNews({
        ...normalized,
        page_token: typeof pageParam === 'string' && pageParam.length > 0 ? pageParam : undefined,
      }),
    getNextPageParam: (lastPage) => lastPage.next_page_token || undefined,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}

export function usePopularMarketInstruments(symbols: string[], enabled = true) {
  const normalizedSymbols = symbols.map((symbol) => symbol.toUpperCase().trim()).filter(Boolean);

  return useQuery({
    queryKey: queryKeys.market.popular(normalizedSymbols),
    queryFn: () => marketService.getPopularInstruments(normalizedSymbols),
    enabled: enabled && normalizedSymbols.length > 0,
    staleTime: 20 * 1000,
  });
}
