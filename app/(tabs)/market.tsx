import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  Filter,
  TrendingUp,
  X,
  CircleDollarSign,
  BarChart3,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomSheet } from '@/components/sheets';
import { Button } from '@/components/ui';
import { InputField } from '@/components/atoms/InputField';
import { useMarketExplore, useMarketNewsFeed } from '@/api/hooks';
import type { MarketExploreQueryParams, MarketInstrumentType } from '@/api/types';
import { useUIStore } from '@/stores';
import { sanitizeAssets } from '@/utils/market';
import { MarketAssetRow } from '@/components/market/MarketAssetRow';
import { MarketNewsCard } from '@/components/market/MarketNewsCard';
import { MarketCategoryCard } from '@/components/market/MarketCategoryCard';

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
      className={`mr-2 min-h-[44px] rounded-full px-4 py-3 ${active ? 'bg-black' : 'bg-surface'}`}>
      <Text className={`font-body text-caption ${active ? 'text-white' : 'text-text-primary'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

function LoadingSkeleton() {
  return (
    <View className="px-md">
      {[...Array(4)].map((_, index) => (
        <View
          key={`skeleton-${index}`}
          className="flex-row items-center border-b border-surface py-4">
          <View className="mr-3 h-12 w-12 rounded-full bg-surface" />
          <View className="flex-1">
            <View className="mb-2 h-4 w-[70%] rounded bg-surface" />
            <View className="h-3 w-[45%] rounded bg-surface" />
          </View>
          <View className="w-[90px] items-end">
            <View className="mb-2 h-4 w-[80px] rounded bg-surface" />
            <View className="h-3 w-[70px] rounded bg-surface" />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function MarketScreen() {
  const router = useRouter();
  const currency = useUIStore((s) => s.currency);
  const rates = useUIStore((s) => s.currencyRates);

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
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 400);

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
      page_size: 20,
    };
  }, [appliedSort, appliedTradableOnly, appliedType, debouncedSearch]);

  const marketExploreQuery = useMarketExplore(exploreParams);
  const marketNewsQuery = useMarketNewsFeed({ limit: 5 });

  const pages = useMemo(
    () => marketExploreQuery.data?.pages ?? [],
    [marketExploreQuery.data?.pages]
  );
  const firstPage = pages[0];

  const cleanedExploreAssets = useMemo(
    () => sanitizeAssets(firstPage?.items ?? []),
    [firstPage?.items]
  );

  const displayedAssets = useMemo(() => cleanedExploreAssets.slice(0, 8), [cleanedExploreAssets]);
  const marketExploreErrorMessage =
    marketExploreQuery.error?.message?.trim() || 'Please try again.';

  const stockCount = firstPage?.facets.types.find((item) => item.value === 'stock')?.count ?? null;
  const etfCount = firstPage?.facets.types.find((item) => item.value === 'etf')?.count ?? null;

  const marketNewsItems = useMemo(() => {
    const pages = marketNewsQuery.data?.pages ?? [];
    const seen = new Set<string>();
    return pages
      .flatMap((page) => page.news)
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
  }, [marketNewsQuery.data?.pages]);
  const marketNewsHasNext = Boolean(
    marketNewsQuery.data?.pages.length &&
    marketNewsQuery.data.pages[marketNewsQuery.data.pages.length - 1]?.next_page_token
  );

  const onOpenExplore = () => {
    router.push({
      pathname: '/market-explore',
      params: {
        q: searchInput.trim() || undefined,
        type: appliedType,
        sort: appliedSort,
        tradable: appliedTradableOnly ? '1' : '0',
      },
    } as any);
  };

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-md pb-lg pt-sm">
          <Text className="font-headline text-headline-1 text-text-primary">Market</Text>

          <View className="mt-lg flex-row items-center">
            <View className="mr-2 flex-1">
              <InputField
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder="Search symbol or name"
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="search"
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

        <View className="pb-lg">
          <View className="mb-md flex-row items-center justify-between px-md">
            <Text className="font-subtitle text-subtitle text-text-primary">Categories</Text>
            <Pressable
              onPress={onOpenExplore}
              accessibilityRole="button"
              accessibilityLabel="See all market categories"
              className="min-h-[44px] flex-row items-center">
              <Text className="mr-1 font-caption text-caption text-text-secondary">See all</Text>
              <ChevronRight size={16} color="#757575" />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 16 }}>
            <MarketCategoryCard
              title="Stocks"
              subtitle={stockCount ? `${stockCount} instruments` : 'Popular equities'}
              Icon={CircleDollarSign}
              onPress={() =>
                router.push({
                  pathname: '/market-explore',
                  params: { type: 'stock', sort: 'top_traded' },
                } as any)
              }
            />
            <MarketCategoryCard
              title="ETFs"
              subtitle={etfCount ? `${etfCount} instruments` : 'Index and thematic ETFs'}
              Icon={BarChart3}
              onPress={() =>
                router.push({
                  pathname: '/market-explore',
                  params: { type: 'etf', sort: 'top_traded' },
                } as any)
              }
            />
            <MarketCategoryCard
              title="Top movers"
              subtitle="Strongest daily change"
              Icon={TrendingUp}
              onPress={() =>
                router.push({
                  pathname: '/market-explore',
                  params: { type: 'all', sort: 'top_movers' },
                } as any)
              }
            />
          </ScrollView>
        </View>

        <View className="px-md">
          <View className="mb-sm flex-row items-center justify-between">
            <Text className="font-subtitle text-subtitle text-text-primary">Popular assets</Text>
            <Pressable
              onPress={onOpenExplore}
              accessibilityRole="button"
              accessibilityLabel="See more assets"
              className="min-h-[44px] flex-row items-center">
              <Text className="mr-1 font-caption text-caption text-text-secondary">See more</Text>
              <ChevronRight size={16} color="#757575" />
            </Pressable>
          </View>

          {marketExploreQuery.isPending && displayedAssets.length === 0 ? (
            <LoadingSkeleton />
          ) : displayedAssets.length > 0 ? (
            <View className="mx-[-16px]">
              {displayedAssets.map((asset) => (
                <MarketAssetRow
                  key={asset.symbol}
                  item={asset}
                  currency={currency}
                  rates={rates}
                  onPress={(item) =>
                    router.push({
                      pathname: '/market-asset/[symbol]',
                      params: { symbol: item.symbol },
                    } as any)
                  }
                />
              ))}
            </View>
          ) : marketExploreQuery.isError ? (
            <View className="rounded-md border border-surface bg-white p-md">
              <Text className="font-subtitle text-body text-text-primary">
                Unable to load assets
              </Text>
              <Text className="mt-1 font-caption text-caption text-text-secondary">
                {marketExploreErrorMessage}
              </Text>
              <View className="mt-4 flex-row gap-2">
                <Button
                  title={marketExploreQuery.isRefetching ? 'Retrying…' : 'Retry'}
                  size="small"
                  onPress={() => {
                    void marketExploreQuery.refetch();
                  }}
                  disabled={marketExploreQuery.isRefetching}
                />
                <Button
                  title="Open explorer"
                  size="small"
                  variant="white"
                  onPress={onOpenExplore}
                />
              </View>
            </View>
          ) : (
            <View className="rounded-md border border-surface bg-white p-md">
              <Text className="font-subtitle text-body text-text-primary">No assets available</Text>
              <Text className="mt-1 font-caption text-caption text-text-secondary">
                Try changing filters or open full explorer.
              </Text>
              <Button title="Open explorer" size="small" className="mt-4" onPress={onOpenExplore} />
            </View>
          )}
        </View>

        <View className="mt-lg px-md">
          <View className="mb-md flex-row items-center justify-between">
            <Text className="font-subtitle text-subtitle text-text-primary">Market news</Text>
            <Text className="font-caption text-caption text-text-secondary">
              {marketNewsItems.length} stories
            </Text>
          </View>

          {marketNewsQuery.isPending && marketNewsItems.length === 0 ? (
            <View className="rounded-md border border-surface bg-white p-md">
              <Text className="font-caption text-caption text-text-secondary">
                Loading latest market news…
              </Text>
            </View>
          ) : marketNewsQuery.isError && marketNewsItems.length === 0 ? (
            <View className="rounded-md border border-surface bg-white p-md">
              <Text className="font-subtitle text-body text-text-primary">
                Unable to load market news
              </Text>
              <Text className="mt-1 font-caption text-caption text-text-secondary">
                Pull to refresh or try again shortly.
              </Text>
            </View>
          ) : marketNewsItems.length > 0 ? (
            <>
              {marketNewsItems.map((news) => (
                <MarketNewsCard key={news.id} item={news} />
              ))}
              {marketNewsHasNext ? (
                <Button
                  title={marketNewsQuery.isFetchingNextPage ? 'Loading more…' : 'Load more news'}
                  variant="white"
                  size="small"
                  disabled={marketNewsQuery.isFetchingNextPage}
                  onPress={() => marketNewsQuery.fetchNextPage()}
                />
              ) : null}
            </>
          ) : (
            <View className="rounded-md border border-surface bg-white p-md">
              <Text className="font-subtitle text-body text-text-primary">No market news yet</Text>
              <Text className="mt-1 font-caption text-caption text-text-secondary">
                Fresh stories will appear here shortly.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

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
