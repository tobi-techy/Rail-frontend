import React from 'react';
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useUIStore } from '@/stores';
import { useHaptics } from '@/hooks/useHaptics';
import { TransactionItem, TransactionItemSkeleton } from '@/components/molecules/TransactionItem';
import { MarketClosedBanner } from '@/components/molecules/MarketClosedBanner';
import { Skeleton } from '@/components/atoms/Skeleton';
import { useInvestmentStashData } from './useInvestmentStashData';
import { invalidateQueries } from '@/api/queryClient';
import { ArrowLeft01Icon, ArrowRight01Icon, ChartDownIcon, ChartUpIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import type {
  InvestmentPositionDetail,
  InvestmentDistributionItem,
  InvestmentTradeTransaction,
  InvestmentPeriod,
  InvestmentRule,
} from '@/api/types/investment';

// ─── Design tokens ────────────────────────────────────────────────────────────
const ACCENT = '#6366F1';
const GREEN = '#16A34A';
const RED = '#DC2626';
const ALLOC_COLORS = ['#6366F1', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];
const PERIODS: InvestmentPeriod[] = ['1W', '1M', '3M', '6M', '1Y', 'ALL'];

// ─── Chart ────────────────────────────────────────────────────────────────────
function PortfolioChart({
  points,
  positive,
  width,
  height,
}: {
  points: number[];
  positive: boolean;
  width: number;
  height: number;
}) {
  const color = positive ? GREEN : RED;
  const path = React.useMemo(() => {
    if (points.length < 2) return null;
    const p = Skia.Path.Make();
    const PAD = 2;
    const step = (width - PAD * 2) / (points.length - 1);
    points.forEach((v, i) => {
      const x = PAD + i * step;
      const y = PAD + (1 - v) * (height - PAD * 2);
      i === 0 ? p.moveTo(x, y) : p.lineTo(x, y);
    });
    return p;
  }, [points, width, height]);

  if (!path) return null;
  return (
    <Canvas style={{ width, height }}>
      <Path
        path={path}
        color={color}
        style="stroke"
        strokeWidth={2}
        strokeCap="round"
        strokeJoin="round"
      />
    </Canvas>
  );
}

// ─── Period pill ──────────────────────────────────────────────────────────────
function PeriodPills({
  selected,
  onSelect,
}: {
  selected: InvestmentPeriod;
  onSelect: (p: InvestmentPeriod) => void;
}) {
  return (
    <View className="flex-row justify-between px-4 py-3">
      {PERIODS.map((p) => {
        const active = p === selected;
        return (
          <Pressable
            key={p}
            onPress={() => onSelect(p)}
            accessibilityRole="button"
            accessibilityLabel={`${p} period`}
            className={`min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-2 ${active ? 'bg-gray-900' : 'bg-transparent'}`}>
            <Text
              className={`text-[13px] ${active ? 'font-button text-white' : 'font-caption text-text-tertiary'}`}>
              {p}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Stats card ───────────────────────────────────────────────────────────────
function StatsRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3.5">
      <Text className="font-caption text-[14px] text-text-secondary">{label}</Text>
      <Text className="font-subtitle text-[14px] text-gray-900">{value}</Text>
    </View>
  );
}

function StatsCard({
  investedValue,
  buyingPower,
  hidden,
}: {
  investedValue: string;
  buyingPower: string;
  hidden: boolean;
}) {
  const mask = '••••';
  return (
    <View className="mx-4 rounded-2xl">
      <StatsRow label="Invested" value={hidden ? mask : investedValue} />
      <View className="mx-4 h-px bg-gray-100" />
      <StatsRow label="Buying power" value={hidden ? mask : buyingPower} />
    </View>
  );
}

// ─── Asset row ────────────────────────────────────────────────────────────────
function AssetRow({
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
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        className="flex-row items-center px-4 py-3.5">
        <View className="mr-3 h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gray-100">
          {item.logo_url ? (
            <Image
              source={{ uri: item.logo_url }}
              style={{ width: 44, height: 44 }}
              resizeMode="cover"
            />
          ) : (
            <Text className="font-subtitle text-[15px] text-gray-700">{item.symbol[0]}</Text>
          )}
        </View>
        <View className="mr-3 flex-1">
          <Text className="font-subtitle text-[15px] text-gray-900" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="mt-0.5 font-caption text-[12px] text-text-tertiary" numberOfLines={1}>
            {item.symbol} · {item.quantity} shares
          </Text>
        </View>
        <View className="items-end">
          <Text className="font-subtitle text-[15px] text-gray-900">
            {item.market_value.formatted}
          </Text>
          <Text className="mt-0.5 font-caption text-[12px]" style={{ color: pnlColor }}>
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

// ─── Pending orders banner ────────────────────────────────────────────────────
function PendingOrdersBanner({ transactions }: { transactions: InvestmentTradeTransaction[] }) {
  const pending = transactions.filter((t) => t.status !== 'filled' && t.status !== 'canceled');
  if (!pending.length) return null;
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      className="mx-4 mt-3 flex-row items-center gap-2 rounded-xl px-3.5 py-2.5"
      style={{ backgroundColor: '#EEF2FF' }}>
      <View className="h-2 w-2 rounded-full" style={{ backgroundColor: ACCENT }} />
      <Text className="flex-1 font-caption text-[13px]" style={{ color: ACCENT }}>
        {pending.length} order{pending.length > 1 ? 's' : ''} pending · updating automatically
      </Text>
    </Animated.View>
  );
}

// ─── Trade row ────────────────────────────────────────────────────────────────
function TradeRow({ tx }: { tx: InvestmentTradeTransaction }) {
  const isBuy = tx.side === 'buy';
  const date = new Date(tx.occurred_at);
  const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return (
    <TransactionItem
      transaction={{
        id: tx.id,
        type: isBuy ? 'deposit' : 'withdraw',
        title: `${isBuy ? 'Bought' : 'Sold'} ${tx.symbol}`,
        subtitle: `${tx.quantity} shares · ${dateLabel}`,
        amount: parseFloat(tx.amount.raw),
        currency: 'USD',
        status: tx.status === 'filled' ? 'completed' : 'pending',
        createdAt: date,
        icon: { type: 'icon', iconName: isBuy ? 'trending-up' : 'trending-down' },
      }}
    />
  );
}

// ─── Allocation donut ─────────────────────────────────────────────────────────
const DONUT_SIZE = 140;
const DONUT_STROKE = 22;
const DONUT_R = (DONUT_SIZE - DONUT_STROKE) / 2;
const DONUT_CX = DONUT_SIZE / 2;
const DONUT_CY = DONUT_SIZE / 2;

function DonutChart({ items }: { items: InvestmentDistributionItem[] }) {
  const total = items.reduce((s, i) => s + i.weight_percent, 0) || 1;
  let cursor = 0;
  const slices = items.map((item, i) => {
    const sweep = (item.weight_percent / total) * 360;
    const start = cursor;
    cursor += sweep + 1.5; // 1.5° gap
    return { item, start, sweep, color: ALLOC_COLORS[i % ALLOC_COLORS.length] };
  });

  return (
    <Canvas style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
      {slices.map(({ item, start, sweep, color }) => {
        const rect = {
          x: DONUT_CX - DONUT_R,
          y: DONUT_CY - DONUT_R,
          width: DONUT_R * 2,
          height: DONUT_R * 2,
        };
        const path = Skia.Path.Make();
        path.addArc(rect, start - 90, Math.min(sweep, 359.99));
        return (
          <Path
            key={item.symbol}
            path={path}
            color={color}
            style="stroke"
            strokeWidth={DONUT_STROKE}
            strokeCap="butt"
          />
        );
      })}
    </Canvas>
  );
}

function AllocationSection({ items }: { items: InvestmentDistributionItem[] }) {
  if (!items.length) return null;
  return (
    <View className="mt-8 px-4">
      <Text className="mb-4 font-subtitle text-[18px] text-gray-900">Allocation</Text>
      <View className="flex-row items-center gap-5">
        <DonutChart items={items} />
        <View className="flex-1 gap-2.5">
          {items.map((item, i) => (
            <View key={item.symbol} className="flex-row items-center gap-2">
              <View
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: ALLOC_COLORS[i % ALLOC_COLORS.length] }}
              />
              <Text className="flex-1 font-caption text-[13px] text-gray-700" numberOfLines={1}>
                {item.symbol}
              </Text>
              <Text className="font-subtitle text-[13px] text-gray-900">
                {item.weight_percent.toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Investment rule ──────────────────────────────────────────────────────────
const RISK_COLORS = ['#EF4444', '#F97316', '#EAB308', '#84CC16', '#22C55E'];

function InvestmentRuleSection({ rule }: { rule: InvestmentRule }) {
  return (
    <View className="mt-8 px-4">
      <Text className="mb-4 font-subtitle text-[18px] text-gray-900">Investment rule</Text>
      <View className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <View className="mb-4 flex-row items-start justify-between">
          <View className="mr-4 flex-1">
            <Text className="font-subtitle text-[16px] text-gray-900">{rule.strategy_name}</Text>
            {rule.age_used !== null && (
              <Text className="mt-1 font-caption text-[12px] text-text-tertiary">
                Based on age {rule.age_used}
              </Text>
            )}
          </View>
          <View className="items-end">
            <Text className="font-caption text-[11px] text-text-tertiary">Risk level</Text>
            <Text className="font-subtitle text-[28px] leading-8 text-gray-900">
              {rule.risk_level}
              <Text className="text-[13px] text-text-tertiary">/5</Text>
            </Text>
          </View>
        </View>
        {/* Risk bar */}
        <View className="mb-1 h-2 flex-row overflow-hidden rounded-full">
          {RISK_COLORS.map((c, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: c }} />
          ))}
        </View>
        <View
          style={{ paddingLeft: `${((rule.risk_level - 1) / 4) * 88}%` as any }}
          className="mb-4">
          <View className="h-3 w-3 rounded-full border-2 border-white bg-gray-900" />
        </View>
        <Text className="mb-4 font-caption text-[13px] leading-5 text-text-secondary">
          {rule.description}
        </Text>
        {[
          { label: 'Equities', pct: rule.stock_allocation, color: ACCENT },
          { label: 'Bonds', pct: rule.bond_allocation, color: '#94A3B8' },
        ].map(({ label, pct, color }) => (
          <View key={label} className="mb-3">
            <View className="mb-1.5 flex-row justify-between">
              <Text className="font-caption text-[13px] text-gray-700">{label}</Text>
              <Text className="font-subtitle text-[13px] text-gray-900">{pct.toFixed(0)}%</Text>
            </View>
            <View className="h-1.5 overflow-hidden rounded-full bg-gray-200">
              <View
                style={{
                  width: `${pct}%` as any,
                  height: '100%',
                  backgroundColor: color,
                  borderRadius: 3,
                }}
              />
            </View>
          </View>
        ))}
        <View
          className="mt-1 self-start rounded-full px-3 py-1"
          style={{ backgroundColor: `${ACCENT}15` }}>
          <Text className="font-subtitle text-[12px]" style={{ color: ACCENT }}>
            {rule.risk_label}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function InvestmentStashScreen() {
  const insets = useSafeAreaInsets();
  const { impact, selection } = useHaptics();
  const { width: sw } = useWindowDimensions();
  const isBalanceVisible = useUIStore((s) => s.isBalanceVisible);
  const [refreshing, setRefreshing] = React.useState(false);

  const {
    isLoading,
    txLoading,
    perfLoading,
    totalBalance,
    investedValue,
    buyingPower,
    netPnlPct,
    investmentRule,
    period,
    setPeriod,
    chartPoints,
    perfReturn,
    perfReturnPct,
    positions,
    positionsTotalCount,
    positionsHasMore,
    distribution,
    transactions,
    positionsLoading,
    hasMoreTx,
    hasPrevTx,
    currentPage,
    nextPage,
    prevPage,
    refetch,
  } = useInvestmentStashData();

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), invalidateQueries.station()]);
    setRefreshing(false);
  }, [refetch]);

  const isPositive = perfReturnPct >= 0;
  const pnlColor = isPositive ? GREEN : RED;
  const chartH = 180;
  const mask = '••••';
  const previewPositions = positions.slice(0, 6);
  const showAllHoldings = positionsTotalCount > previewPositions.length || positionsHasMore;

  // Sections rendered below the sticky header+hero
  type Section =
    | { key: 'banner' }
    | { key: 'hero' }
    | { key: 'pending' }
    | { key: 'chart' }
    | { key: 'periods' }
    | { key: 'stats' }
    | { key: 'holdings' }
    | { key: 'transactions' }
    | { key: 'allocation' }
    | { key: 'rule' }
    | { key: 'footer' };

  const sections: Section[] = [
    { key: 'banner' },
    { key: 'hero' },
    { key: 'pending' },
    { key: 'chart' },
    { key: 'periods' },
    { key: 'stats' },
    { key: 'holdings' },
    { key: 'transactions' },
    { key: 'allocation' },
    { key: 'rule' },
    { key: 'footer' },
  ];

  const renderSection = ({ item }: { item: Section }) => {
    switch (item.key) {
      case 'banner':
        return <MarketClosedBanner />;

      case 'hero':
        return (
          <View className="px-4 pb-2 pt-6">
            {isLoading ? (
              <View className="gap-2">
                <Skeleton style={{ width: 140, height: 48, borderRadius: 10 }} />
                <Skeleton style={{ width: 180, height: 16 }} />
              </View>
            ) : (
              <Animated.View entering={FadeIn.duration(200)}>
                <Text className="mb-1 font-caption text-[13px] text-text-tertiary">
                  Portfolio value
                </Text>
                <Text
                  className="font-subtitle text-gray-900"
                  style={{ fontSize: 44, letterSpacing: -1.5, lineHeight: 52 }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}>
                  {isBalanceVisible ? totalBalance : mask}
                </Text>
                <View className="mt-1.5 flex-row items-center gap-1">
                  {isPositive ? (
                    <HugeiconsIcon icon={ChartUpIcon} size={14} color={pnlColor} strokeWidth={2} />
                  ) : (
                    <HugeiconsIcon icon={ChartDownIcon} size={14} color={pnlColor} strokeWidth={2} />
                  )}
                  <Text className="font-caption text-[14px]" style={{ color: pnlColor }}>
                    {isBalanceVisible
                      ? `${perfReturn ? perfReturn + ' ' : ''}(${isPositive ? '+' : ''}${perfReturnPct.toFixed(2)}%)`
                      : mask}{' '}
                    <Text className="text-text-tertiary">· {period}</Text>
                  </Text>
                </View>
              </Animated.View>
            )}
          </View>
        );

      case 'pending':
        return <PendingOrdersBanner transactions={transactions} />;

      case 'chart':
        return (
          <View className="mt-2">
            {perfLoading || isLoading ? (
              <View style={{ height: chartH, backgroundColor: '#F9FAFB' }} />
            ) : chartPoints.length >= 2 ? (
              <Animated.View entering={FadeIn.duration(300)}>
                <PortfolioChart
                  points={chartPoints}
                  positive={isPositive}
                  width={sw}
                  height={chartH}
                />
              </Animated.View>
            ) : (
              <View style={{ height: chartH }} className="items-center justify-center">
                <Text className="font-caption text-[13px] text-gray-300">No chart data yet</Text>
              </View>
            )}
          </View>
        );

      case 'periods':
        return (
          <PeriodPills
            selected={period}
            onSelect={(p) => {
              selection();
              setPeriod(p);
            }}
          />
        );

      case 'stats':
        return isLoading ? (
          <View className="mx-4">
            <Skeleton style={{ height: 48, borderRadius: 16 }} className="w-full" />
          </View>
        ) : (
          <StatsCard
            investedValue={investedValue}
            buyingPower={buyingPower}
            hidden={!isBalanceVisible}
          />
        );

      case 'holdings':
        return (
          <View className="mt-8 px-4">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="font-subtitle text-[18px] text-gray-900">Holdings</Text>
              {showAllHoldings && !isLoading && !positionsLoading && (
                <Pressable
                  onPress={() => {
                    impact();
                    router.push('/investment-stash/holdings');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="View all holdings"
                  className="rounded-xl bg-gray-100 px-3 py-1.5">
                  <Text className="font-subtitle text-[12px] text-gray-900">View all</Text>
                </Pressable>
              )}
            </View>
            <View className="overflow-hidden rounded-2xl">
              {isLoading || positionsLoading ? (
                [0, 1, 2].map((i) => (
                  <View key={i} className="flex-row items-center gap-3 p-4">
                    <Skeleton style={{ width: 44, height: 44, borderRadius: 22 }} />
                    <View className="flex-1 gap-2">
                      <Skeleton className="w-[45%]" style={{ height: 14 }} />
                      <Skeleton className="w-[30%]" style={{ height: 11 }} />
                    </View>
                    <View className="items-end gap-2">
                      <Skeleton style={{ width: 64, height: 14 }} />
                      <Skeleton style={{ width: 48, height: 11 }} />
                    </View>
                  </View>
                ))
              ) : previewPositions.length === 0 ? (
                <View className="items-center py-10">
                  <Text className="font-caption text-[14px] text-text-tertiary">
                    No holdings yet
                  </Text>
                  <Text className="mt-1 font-caption text-[12px] text-gray-300">
                    Auto-invest will place orders soon
                  </Text>
                </View>
              ) : (
                previewPositions.map((pos, i) => (
                  <AssetRow
                    key={pos.id}
                    item={pos}
                    showSep={i < previewPositions.length - 1}
                    onPress={() => {
                      impact();
                      router.push({
                        pathname: `/market-asset/${pos.symbol}` as any,
                        params: { symbol: pos.symbol },
                      });
                    }}
                  />
                ))
              )}
            </View>
          </View>
        );

      case 'transactions':
        return (
          <View className="mt-8 px-4">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="font-subtitle text-[18px] text-gray-900">Transactions</Text>
              {(hasPrevTx || hasMoreTx) && (
                <Text className="font-caption text-[12px] text-text-tertiary">
                  Page {currentPage}
                </Text>
              )}
            </View>
            <View className="overflow-hidden rounded-2xl px-1">
              {txLoading ? (
                [0, 1, 2].map((i) => <TransactionItemSkeleton key={i} />)
              ) : transactions.length === 0 ? (
                <View className="items-center py-10">
                  <Text className="font-caption text-[14px] text-text-tertiary">
                    No transactions yet
                  </Text>
                </View>
              ) : (
                transactions.map((tx) => <TradeRow key={tx.id} tx={tx} />)
              )}
            </View>
            {(hasPrevTx || hasMoreTx) && (
              <View className="mt-3 flex-row justify-between">
                <Pressable
                  onPress={() => {
                    impact();
                    prevPage();
                  }}
                  disabled={!hasPrevTx}
                  accessibilityRole="button"
                  accessibilityLabel="Previous page"
                  className="min-h-[44px] flex-row items-center gap-1 rounded-xl bg-gray-100 px-4 py-2.5"
                  style={{ opacity: hasPrevTx ? 1 : 0 }}>
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={16} color="#111827" strokeWidth={2} />
                  <Text className="font-subtitle text-[13px] text-gray-900">Prev</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    impact();
                    nextPage();
                  }}
                  disabled={!hasMoreTx}
                  accessibilityRole="button"
                  accessibilityLabel="Next page"
                  className="min-h-[44px] flex-row items-center gap-1 rounded-xl bg-gray-100 px-4 py-2.5"
                  style={{ opacity: hasMoreTx ? 1 : 0 }}>
                  <Text className="font-subtitle text-[13px] text-gray-900">Next</Text>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="#111827" strokeWidth={2} />
                </Pressable>
              </View>
            )}
          </View>
        );

      case 'allocation':
        return isLoading || distribution.length > 0 ? (
          isLoading ? (
            <View style={{ marginTop: 32, paddingHorizontal: 16, gap: 8 }}>
              <Skeleton style={{ width: 100, height: 20 }} />
              <Skeleton style={{ height: 8, borderRadius: 4 }} className="w-full" />
              <Skeleton style={{ height: 48, borderRadius: 16 }} className="w-full" />
            </View>
          ) : (
            <AllocationSection items={distribution} />
          )
        ) : null;

      case 'rule':
        return (
          <View>
            {isLoading ? (
              <View style={{ marginTop: 32, paddingHorizontal: 16, gap: 8 }}>
                <Skeleton style={{ width: 120, height: 20 }} />
                <Skeleton style={{ height: 160, borderRadius: 16 }} className="w-full" />
              </View>
            ) : investmentRule ? (
              <Animated.View entering={FadeIn.duration(200)}>
                <InvestmentRuleSection rule={investmentRule} />
              </Animated.View>
            ) : null}
          </View>
        );

      case 'footer':
        return <View className="h-12" />;

      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
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
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#111827" strokeWidth={2} />
        </Pressable>
        <Text className="font-subtitle text-[17px] text-gray-900">Invest</Text>
      </View>

      <FlatList
        data={sections}
        keyExtractor={(item) => item.key}
        renderItem={renderSection}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      />
    </View>
  );
}
