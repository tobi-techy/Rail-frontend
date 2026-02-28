import { useEffect, useMemo, useState } from 'react';
import type { MarketExploreQueryParams, MarketInstrumentType } from '@/api/types';

export type TypeFilter = 'all' | MarketInstrumentType;
export type SortFilter = 'symbol' | 'top_movers' | 'top_traded';

export const SORT_OPTIONS: { id: SortFilter; label: string }[] = [
  { id: 'symbol', label: 'Alphabetical' },
  { id: 'top_movers', label: 'Top movers' },
  { id: 'top_traded', label: 'Top traded' },
];

export const TYPE_OPTIONS: { id: TypeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'stock', label: 'Stocks' },
  { id: 'etf', label: 'ETFs' },
];

export function useMarketFilters() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const [appliedType, setAppliedType] = useState<TypeFilter>('stock');
  const [appliedSort, setAppliedSort] = useState<SortFilter>('top_traded');
  const [appliedTradableOnly, setAppliedTradableOnly] = useState(false);

  const [draftType, setDraftType] = useState<TypeFilter>('stock');
  const [draftSort, setDraftSort] = useState<SortFilter>('top_traded');
  const [draftTradableOnly, setDraftTradableOnly] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const exploreParams = useMemo<MarketExploreQueryParams>(
    () => ({
      q: debouncedSearch || undefined,
      types: appliedType === 'all' ? undefined : [appliedType],
      tradable: appliedTradableOnly ? true : undefined,
      sort_by:
        appliedSort === 'top_movers'
          ? 'change_pct'
          : appliedSort === 'top_traded'
            ? 'volume'
            : 'symbol',
      sort_order: appliedSort === 'symbol' ? 'asc' : 'desc',
      page_size: 20,
    }),
    [appliedSort, appliedTradableOnly, appliedType, debouncedSearch]
  );

  const applyFilters = () => {
    setAppliedType(draftType);
    setAppliedSort(draftSort);
    setAppliedTradableOnly(draftTradableOnly);
    setShowFilterSheet(false);
  };

  const resetDraft = () => {
    setDraftType('stock');
    setDraftSort('top_traded');
    setDraftTradableOnly(false);
  };

  return {
    searchInput,
    setSearchInput,
    showFilterSheet,
    setShowFilterSheet,
    appliedType,
    appliedSort,
    appliedTradableOnly,
    draftType,
    setDraftType,
    draftSort,
    setDraftSort,
    draftTradableOnly,
    setDraftTradableOnly,
    exploreParams,
    applyFilters,
    resetDraft,
  };
}
