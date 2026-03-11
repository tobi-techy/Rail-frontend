import React from 'react';
import { FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useHaptics } from '@/hooks/useHaptics';
import { useInvestmentPositions } from '@/api/hooks/useInvestment';
import type { InvestmentPositionDetail } from '@/api/types/investment';

const PAGE_SIZE = 20;
const GREEN = '#16A34A';
const RED = '#DC2626';

function Shimmer({ w, h, radius = 8 }: { w: number | `${number}%`; h: number; radius?: number }) {
  return (
    <View
      style={{ width: w as any, height: h, borderRadius: radius, backgroundColor: '#F3F4F6' }}
    />
  );
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
  const pnlColor = pos ? GREEN : RED;
  const sign = pos ? '+' : '';
  return (
    <View>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`View ${item.name} details`}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
        })}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#F3F4F6',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            marginRight: 12,
          }}>
          {item.logo_url ? (
            <Image
              source={{ uri: item.logo_url }}
              style={{ width: 44, height: 44 }}
              resizeMode="cover"
            />
          ) : (
            <Text style={{ fontSize: 15, fontFamily: 'SF-Pro-Rounded-Semibold', color: '#374151' }}>
              {item.symbol[0]}
            </Text>
          )}
        </View>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text
            style={{ fontSize: 15, fontFamily: 'SF-Pro-Rounded-Semibold', color: '#111827' }}
            numberOfLines={1}>
            {item.name}
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'SF-Pro-Rounded-Regular',
              color: '#9CA3AF',
              marginTop: 2,
            }}
            numberOfLines={1}>
            {item.symbol} · {item.quantity} shares
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 15, fontFamily: 'SF-Pro-Rounded-Semibold', color: '#111827' }}>
            {item.market_value.formatted}
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'SF-Pro-Rounded-Regular',
              color: pnlColor,
              marginTop: 2,
            }}>
            {sign}
            {item.unrealized_pnl.formatted} ({sign}
            {item.unrealized_pnl_percent.toFixed(2)}%)
          </Text>
        </View>
      </Pressable>
      {showSep && <View style={{ height: 1, backgroundColor: '#F3F4F6', marginLeft: 72 }} />}
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
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: insets.top + 8,
          paddingBottom: 4,
        }}>
        <Pressable
          onPress={() => {
            impact();
            router.back();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 4,
          }}>
          <ChevronLeft size={24} color="#111827" strokeWidth={2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontFamily: 'SF-Pro-Rounded-Semibold', color: '#111827' }}>
            Holdings
          </Text>
          <Text style={{ fontSize: 12, fontFamily: 'SF-Pro-Rounded-Regular', color: '#9CA3AF' }}>
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
            <View style={{ padding: 16, gap: 12 }}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Shimmer w={44} h={44} radius={22} />
                  <View style={{ flex: 1, gap: 8 }}>
                    <Shimmer w="45%" h={14} />
                    <Shimmer w="30%" h={11} />
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <Shimmer w={64} h={14} />
                    <Shimmer w={48} h={11} />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Text
                style={{ fontSize: 14, fontFamily: 'SF-Pro-Rounded-Regular', color: '#9CA3AF' }}>
                No holdings yet
              </Text>
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
                params: { position: JSON.stringify(item) },
              });
            }}
          />
        )}
        ListFooterComponent={
          items.length > 0 ? (
            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <Pressable
                  onPress={() => {
                    impact();
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  disabled={!hasPrev || isFetching}
                  accessibilityRole="button"
                  accessibilityLabel="Previous page"
                  style={{
                    opacity: hasPrev ? 1 : 0,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: '#F3F4F6',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    minHeight: 44,
                  }}>
                  <ChevronLeft size={16} color="#111827" strokeWidth={2} />
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'SF-Pro-Rounded-Semibold',
                      color: '#111827',
                    }}>
                    Prev
                  </Text>
                </Pressable>
                <Text
                  style={{ fontSize: 12, fontFamily: 'SF-Pro-Rounded-Regular', color: '#9CA3AF' }}>
                  Page {page}
                </Text>
                <Pressable
                  onPress={() => {
                    impact();
                    if (hasMore) setPage((p) => p + 1);
                  }}
                  disabled={!hasMore || isFetching}
                  accessibilityRole="button"
                  accessibilityLabel="Next page"
                  style={{
                    opacity: hasMore ? 1 : 0,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: '#F3F4F6',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    minHeight: 44,
                  }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'SF-Pro-Rounded-Semibold',
                      color: '#111827',
                    }}>
                    Next
                  </Text>
                  <ChevronRight size={16} color="#111827" strokeWidth={2} />
                </Pressable>
              </View>
              {isFetching && (
                <Text
                  style={{
                    marginTop: 8,
                    textAlign: 'center',
                    fontSize: 12,
                    fontFamily: 'SF-Pro-Rounded-Regular',
                    color: '#9CA3AF',
                  }}>
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
