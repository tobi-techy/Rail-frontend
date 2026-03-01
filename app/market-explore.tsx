import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Filter, X } from 'lucide-react-native';
import { BottomSheet } from '@/components/sheets';
import { Button } from '@/components/ui';
import { InputField } from '@/components/atoms/InputField';
import { useMarketExplore } from '@/api/hooks';
import type { MarketExploreQueryParams, MarketInstrumentType } from '@/api/types';
import { useUIStore } from '@/stores';
import { sanitizeAssets } from '@/utils/market';
import { MarketAssetRow } from '@/components/market/MarketAssetRow';

type TypeFilter = 'all' | MarketInstrumentType;
type SortFilter = 'symbol' | 'top_movers' | 'top_traded';

const SORT_OPTIONS: { id: SortFilter; label: string }[] = [
  { id: 'symbol', label: 'Alphabetical' },
  { id: 'top_movers', label: 'Top movers' },
  { id: 'top_traded', label: 'Top traded' },
];

const TYPE_OPTIONS: { id: TypeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'stock', label: 'Stocks' },
  { id: 'etf', label: 'ETFs' },
];

const asType = (value?: string | string[]): TypeFilter => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'stock' || raw === 'etf' || raw === 'all') return raw;
  return 'stock';
};

const asSort = (value?: string | string[]): SortFilter => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'top_movers' || raw === 'top_traded' || raw === 'symbol') return raw;
  return 'top_traded';
};

const asBool = (value?: string | string[]): boolean => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === '1' || raw === 'true';
};

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`mb-2 mr-2 min-h-[44px] rounded-full px-4 py-3 ${active ? 'bg-black' : 'bg-surface'}`}>
      <Text className={`font-body text-caption ${active ? 'text-white' : 'text-text-primary'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function MarketExploreScreen() {
  const params = useLocalSearchParams();
  const currency = useUIStore((s) => s.currency);
  const rates = useUIStore((s) => s.currencyRates);

  const [searchInput, setSearchInput] = useState(typeof params.q === 'string' ? params.q : '');
  const [debouncedSearch, setDebouncedSearch] = useState(
    typeof params.q === 'string' ? params.q : ''
  );
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const [appliedType, setAppliedType] = useState<TypeFilter>(asType(params.type));
  const [appliedSort, setAppliedSort] = useState<SortFilter>(asSort(params.sort));
  const [appliedTradableOnly, setAppliedTradableOnly] = useState(asBool(params.tradable));

  const [draftType, setDraftType] = useState<TypeFilter>(asType(params.type));
  const [draftSort, setDraftSort] = useState<SortFilter>(asSort(params.sort));
  const [draftTradableOnly, setDraftTradableOnly] = useState(asBool(params.tradable));

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const exploreParams = useMemo<MarketExploreQueryParams>(() => {
    const sortBy =
      appliedSort === 'top_movers'
        ? 'change_pct'
        : appliedSort === 'top_traded'
          ? 'volume'
          : 'symbol';
    const sortOrder = appliedSort === 'symbol' ? 'asc' : 'desc';

    return {
      q: debouncedSearch || undefined,
      types: appliedType === 'all' ? undefined : [appliedType],
      tradable: appliedTradableOnly ? true : undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
      page_size: 25,
    };
  }, [appliedSort, appliedTradableOnly, appliedType, debouncedSearch]);

  const marketExploreQuery = useMarketExplore(exploreParams);
  const pages = useMemo(
    () => marketExploreQuery.data?.pages ?? [],
    [marketExploreQuery.data?.pages]
  );

  const displayedAssets = useMemo(
    () => sanitizeAssets(pages.flatMap((page) => page.items)),
    [pages]
  );

  const firstPage = pages[0];
  const hasNext = Boolean(pages.length > 0 && pages[pages.length - 1]?.pagination.has_next);

  const applyFilters = () => {
    setAppliedType(draftType);
    setAppliedSort(draftSort);
    setAppliedTradableOnly(draftTradableOnly);
    setShowFilterSheet(false);
  };

  const resetFilters = () => {
    setDraftType('stock');
    setDraftSort('top_traded');
    setDraftTradableOnly(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-background-main" edges={['top']}>
      <View className="flex-row items-center px-md py-sm">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="mr-2 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-surface">
          <ArrowLeft size={18} color="#111111" />
        </Pressable>
        <Text className="font-subtitle text-subtitle text-text-primary">Explore assets</Text>
      </View>

      <View className="px-md pb-md">
        <View className="flex-row items-center">
          <View className="mr-2 flex-1">
            <InputField
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Search symbol or name"
              autoCapitalize="characters"
              autoCorrect={false}
              icon="search-outline"
              density="compact"
              inputWrapperClassName="rounded-full border-surface bg-surface"
              accessibilityLabel="Search market assets"
              rightAccessory={
                searchInput.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchInput('');
                      setDebouncedSearch('');
                    }}
                    className="min-h-[44px] min-w-[44px] items-center justify-center"
                    accessibilityRole="button"
                    accessibilityLabel="Clear search">
                    <X size={16} color="#757575" />
                  </TouchableOpacity>
                ) : undefined
              }
            />
          </View>

          <Pressable
            onPress={() => setShowFilterSheet(true)}
            className="min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black"
            accessibilityRole="button"
            accessibilityLabel="Open market filters">
            <Filter size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <Text className="mt-sm font-caption text-caption text-text-secondary">
          {appliedType === 'all' ? 'All types' : appliedType === 'stock' ? 'Stocks' : 'ETFs'} •{' '}
          {SORT_OPTIONS.find((option) => option.id === appliedSort)?.label}
          {appliedTradableOnly ? ' • Tradable only' : ''}
        </Text>
      </View>

      {marketExploreQuery.isPending && displayedAssets.length === 0 ? (
        <View className="px-md py-lg">
          <Text className="font-caption text-caption text-text-secondary">
            Loading market assets…
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayedAssets}
          keyExtractor={(item) => item.symbol}
          renderItem={({ item }) => (
            <MarketAssetRow
              item={item}
              currency={currency}
              rates={rates}
              onPress={(asset) =>
                router.push({
                  pathname: '/market-asset/[symbol]',
                  params: { symbol: asset.symbol },
                } as never)
              }
            />
          )}
          ListHeaderComponent={
            <View className="px-md pb-sm">
              <Text className="font-caption text-caption text-text-secondary">
                {firstPage?.pagination.total_items ?? displayedAssets.length} instruments
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View className="px-md py-lg">
              <Text className="font-subtitle text-body text-text-primary">No matching assets</Text>
              <Text className="mt-1 font-caption text-caption text-text-secondary">
                Try broader filters or search by a ticker symbol.
              </Text>
            </View>
          }
          ListFooterComponent={
            hasNext ? (
              <View className="px-md pb-[120px] pt-md">
                <Button
                  title={
                    marketExploreQuery.isFetchingNextPage ? 'Loading more…' : 'Load more assets'
                  }
                  variant="white"
                  size="small"
                  disabled={marketExploreQuery.isFetchingNextPage}
                  onPress={() => marketExploreQuery.fetchNextPage()}
                />
              </View>
            ) : (
              <View className="pb-[120px]" />
            )
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomSheet visible={showFilterSheet} onClose={() => setShowFilterSheet(false)}>
        <View className="pb-2">
          <Text className="font-subtitle text-subtitle text-text-primary">Filters</Text>

          <Text className="mb-2 mt-lg font-caption text-caption text-text-secondary">Type</Text>
          <View className="mb-md flex-row">
            {TYPE_OPTIONS.map((option) => (
              <FilterChip
                key={option.id}
                label={option.label}
                active={draftType === option.id}
                onPress={() => setDraftType(option.id)}
              />
            ))}
          </View>

          <Text className="mb-2 font-caption text-caption text-text-secondary">Sort by</Text>
          <View className="mb-md flex-row flex-wrap">
            {SORT_OPTIONS.map((option) => (
              <FilterChip
                key={option.id}
                label={option.label}
                active={draftSort === option.id}
                onPress={() => setDraftSort(option.id)}
              />
            ))}
          </View>

          <Text className="mb-2 font-caption text-caption text-text-secondary">Liquidity</Text>
          <FilterChip
            label="Tradable only"
            active={draftTradableOnly}
            onPress={() => setDraftTradableOnly((prev) => !prev)}
          />

          <View className="mt-lg flex-row">
            <Button title="Reset" variant="white" size="small" flex onPress={resetFilters} />
            <View className="w-2" />
            <Button title="Apply" variant="black" size="small" flex onPress={applyFilters} />
          </View>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
