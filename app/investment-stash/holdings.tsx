import React from 'react';
import { FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useHaptics } from '@/hooks/useHaptics';
import { useInvestmentPositions } from '@/api/hooks/useInvestment';
import type { InvestmentPositionDetail } from '@/api/types/investment';

const PAGE_SIZE = 20;

function Shimmer({ w, h, radius = 'rounded-lg' }: { w: string; h: string; radius?: string }) {
  return <View className={`${w} ${h} ${radius} bg-gray-100`} />;
}

function HoldingRow({
  item,
  showSep,
  onPress,
}: {
  item: InvestmentPositionDetail;
  showSep: boolean;
  onPress: () => void;
}) {
  const pos = item.unrealized_pnl_percent >= 0;
  const pnlColor = pos ? 'text-green-600' : 'text-red-600';
  const sign = pos ? '+' : '';
  return (
    <View>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`View ${item.name} details`}
        className="flex-row items-center px-4 py-3.5 active:opacity-70">
        <View className="mr-3 h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gray-100">
          {item.logo_url ? (
            <Image source={{ uri: item.logo_url }} className="h-11 w-11" resizeMode="cover" />
          ) : (
            <Text className="font-button text-sm text-gray-700">{item.symbol[0]}</Text>
          )}
        </View>
        <View className="mr-3 flex-1">
          <Text className="font-button text-[15px] text-gray-900" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="mt-0.5 font-caption text-xs text-gray-400" numberOfLines={1}>
            {item.symbol} · {item.quantity} shares
          </Text>
        </View>
        <View className="items-end">
          <Text className="font-button text-[15px] text-gray-900">
            {item.market_value.formatted}
          </Text>
          <Text className={`mt-0.5 font-caption text-xs ${pnlColor}`}>
            {sign}
            {item.unrealized_pnl.formatted} ({sign}
            {item.unrealized_pnl_percent.toFixed(2)}%)
          </Text>
        </View>
      </Pressable>
      {showSep && <View className="ml-[72px] h-px bg-gray-100" />}
    </View>
  );
}

export default function InvestmentHoldingsScreen() {
  const insets = useSafeAreaInsets();
  const { impact } = useHaptics();
  const [page, setPage] = React.useState(1);
  const [refreshing, setRefreshing] = React.useState(false);

  const { data, isLoading, isFetching, refetch } = useInvestmentPositions({
    page,
    page_size: PAGE_SIZE,
  });

  const items = data?.items ?? [];
  const totalCount = data?.total_count ?? items.length;
  const hasMore = data?.has_more ?? false;
  const hasPrev = page > 1;

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center px-4 pb-1" style={{ paddingTop: insets.top + 8 }}>
        <Pressable
          onPress={() => {
            impact();
            router.back();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="mr-1 h-11 w-11 items-center justify-center">
          <ChevronLeft size={24} color="#111827" strokeWidth={2} />
        </Pressable>
        <View className="flex-1">
          <Text className="font-button text-[17px] text-gray-900">Holdings</Text>
          <Text className="font-caption text-xs text-gray-400">
            {totalCount} asset{totalCount === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        ListEmptyComponent={
          isLoading ? (
            <View className="gap-3 p-4">
              {[0, 1, 2, 3].map((i) => (
                <View key={i} className="flex-row items-center gap-3">
                  <Shimmer w="w-11" h="h-11" radius="rounded-full" />
                  <View className="flex-1 gap-2">
                    <Shimmer w="w-[45%]" h="h-3.5" />
                    <Shimmer w="w-[30%]" h="h-3" />
                  </View>
                  <View className="items-end gap-2">
                    <Shimmer w="w-16" h="h-3.5" />
                    <Shimmer w="w-12" h="h-3" />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="items-center py-12">
              <Text className="font-caption text-sm text-gray-400">No holdings yet</Text>
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <HoldingRow
            item={item}
            showSep={index < items.length - 1}
            onPress={() => {
              impact();
              router.push({
                pathname: `/market-asset/${item.symbol}` as any,
                params: { symbol: item.symbol },
              });
            }}
          />
        )}
        ListFooterComponent={
          items.length > 0 ? (
            <View className="px-4 pt-4">
              <View className="flex-row items-center justify-between">
                <Pressable
                  onPress={() => {
                    impact();
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  disabled={!hasPrev || isFetching}
                  accessibilityRole="button"
                  accessibilityLabel="Previous page"
                  className={`min-h-[44px] flex-row items-center gap-1 rounded-xl bg-gray-100 px-4 py-2.5 ${!hasPrev ? 'opacity-0' : ''}`}>
                  <ChevronLeft size={16} color="#111827" strokeWidth={2} />
                  <Text className="font-button text-[13px] text-gray-900">Prev</Text>
                </Pressable>
                <Text className="font-caption text-xs text-gray-400">Page {page}</Text>
                <Pressable
                  onPress={() => {
                    impact();
                    if (hasMore) setPage((p) => p + 1);
                  }}
                  disabled={!hasMore || isFetching}
                  accessibilityRole="button"
                  accessibilityLabel="Next page"
                  className={`min-h-[44px] flex-row items-center gap-1 rounded-xl bg-gray-100 px-4 py-2.5 ${!hasMore ? 'opacity-0' : ''}`}>
                  <Text className="font-button text-[13px] text-gray-900">Next</Text>
                  <ChevronRight size={16} color="#111827" strokeWidth={2} />
                </Pressable>
              </View>
              {isFetching && (
                <Text className="mt-2 text-center font-caption text-xs text-gray-400">
                  Loading…
                </Text>
              )}
            </View>
          ) : null
        }
      />
    </View>
  );
}
