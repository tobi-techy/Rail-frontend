import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import type { DimensionValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useUIStore } from '@/stores';
import { useHaptics } from '@/hooks/useHaptics';
import { TransactionItem, TransactionItemSkeleton } from '@/components/molecules/TransactionItem';
import { MarketClosedBanner } from '@/components/molecules/MarketClosedBanner';
import { useInvestmentStashData } from './useInvestmentStashData';
import type {
  InvestmentPositionDetail,
  InvestmentDistributionItem,
  InvestmentTradeTransaction,
  InvestmentPeriod,
  InvestmentRule,
} from '@/api/types/investment';

const ACCENT = '#6366F1';
const ALLOCATION_COLORS = ['#6366F1', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];
const PERIODS: InvestmentPeriod[] = ['1W', '1M', '3M', '6M', '1Y', 'ALL'];

// ── Shimmer ───────────────────────────────────────────────────────────────────

function Shimmer({ w, h, radius = 8 }: { w: DimensionValue; h: number; radius?: number }) {
  return <View style={{ width: w, height: h, borderRadius: radius }} className="bg-gray-100" />;
}

// ── Line chart ────────────────────────────────────────────────────────────────

function PortfolioChart({
  points,
  isPositive,
  width,
  height,
}: {
  points: number[];
  isPositive: boolean;
  width: number;
  height: number;
}) {
  const PAD = 2;
  const color = isPositive ? '#16A34A' : '#DC2626';
  const path = React.useMemo(() => {
    if (points.length < 2) return null;
    const p = Skia.Path.Make();
    const step = (width - PAD * 2) / (points.length - 1);
    points.forEach((v, i) => {
      const x = PAD + i * step;
      const y = PAD + (1 - v) * (height - PAD * 2);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
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

// ── Period selector ───────────────────────────────────────────────────────────

function PeriodSelector({
  selected,
  onSelect,
}: {
  selected: InvestmentPeriod;
  onSelect: (p: InvestmentPeriod) => void;
}) {
  return (
    <View className="flex-row gap-0.5 self-start rounded-[20px] bg-gray-50 p-1">
      {PERIODS.map((p) => {
        const active = p === selected;
        return (
          <Pressable
            key={p}
            onPress={() => onSelect(p)}
            className={`rounded-2xl px-3 py-1.5 ${active ? 'bg-white' : 'bg-transparent'}`}
            accessibilityRole="button">
            <Text
              className={`text-[12px] ${active ? 'font-button text-black' : 'font-caption text-black/40'}`}>
              {p}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Asset row ─────────────────────────────────────────────────────────────────

function AssetRow({ position, showSep }: { position: InvestmentPositionDetail; showSep: boolean }) {
  const isPositive = position.unrealized_pnl_percent >= 0;
  const pctColor = isPositive ? '#16A34A' : '#DC2626';
  return (
    <View>
      <View className="flex-row items-center px-4 py-3.5">
        <View
          className="mr-3.5 h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: `${ACCENT}18` }}>
          <Text className="font-button text-sm" style={{ color: ACCENT }}>
            {position.symbol.slice(0, 3)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="font-button text-[15px] text-black">{position.symbol}</Text>
          <Text className="mt-0.5 font-caption text-[12px] text-black/50">
            {position.quantity} shares
          </Text>
        </View>
        <View className="items-end">
          <Text className="font-button text-[15px] text-black">
            {position.market_value.formatted}
          </Text>
          <Text className="mt-0.5 font-caption text-[12px]" style={{ color: pctColor }}>
            {isPositive ? '+' : ''}
            {position.unrealized_pnl_percent.toFixed(2)}%
          </Text>
        </View>
      </View>
      {showSep && <View className="ml-[74px] h-px bg-gray-100" />}
    </View>
  );
}

// ── Trade row ─────────────────────────────────────────────────────────────────

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

// ── Allocation bar ────────────────────────────────────────────────────────────

function AllocationBar({ items }: { items: InvestmentDistributionItem[] }) {
  if (!items.length) return null;
  return (
    <View className="mb-3 h-2 flex-row overflow-hidden rounded-full">
      {items.map((item, i) => (
        <View
          key={item.symbol}
          style={{
            flex: item.weight_percent,
            backgroundColor: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length],
          }}
        />
      ))}
    </View>
  );
}

function AllocationRow({
  item,
  index,
  showSep,
}: {
  item: InvestmentDistributionItem;
  index: number;
  showSep: boolean;
}) {
  return (
    <View>
      <View className="flex-row items-center px-4 py-3">
        <View
          className="mr-3 h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length] }}
        />
        <Text className="flex-1 font-body text-[14px] text-black">{item.symbol}</Text>
        <Text className="mr-4 font-caption text-[13px] text-black/50">{item.value.formatted}</Text>
        <Text className="w-14 text-right font-button text-[13px] text-black">
          {item.weight_percent.toFixed(2)}%
        </Text>
      </View>
      {showSep && <View className="ml-10 h-px bg-gray-100" />}
    </View>
  );
}

// ── Risk bar ──────────────────────────────────────────────────────────────────

const RISK_GRADIENT = ['#EF4444', '#F97316', '#EAB308', '#84CC16', '#22C55E'];

function RiskBar({ level }: { level: number }) {
  return (
    <View>
      {/* Gradient track */}
      <View className="h-2.5 flex-row overflow-hidden rounded-full">
        {RISK_GRADIENT.map((color, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: color }} />
        ))}
      </View>
      {/* Indicator */}
      <View style={{ paddingLeft: `${((level - 1) / 4) * 92}%` }} className="mt-1">
        <View className="h-3 w-3 rounded-full border-2 border-white bg-black shadow-sm" />
      </View>
      {/* Labels */}
      <View className="mt-1 flex-row justify-between">
        {['Very low', 'Low', 'Avg', 'High', 'Very high'].map((l) => (
          <Text key={l} className="font-caption text-[10px] text-black/40">
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ── Investment rule card ──────────────────────────────────────────────────────

function InvestmentRuleCard({ rule }: { rule: InvestmentRule }) {
  return (
    <View className="overflow-hidden rounded-[20px] bg-gray-50 p-5">
      {/* Header */}
      <View className="mb-4 flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <Text className="font-headline text-[18px] text-black">{rule.strategy_name}</Text>
          {rule.age_used !== null && (
            <Text className="mt-0.5 font-caption text-[12px] text-black/40">
              Based on age {rule.age_used}
            </Text>
          )}
        </View>
        <View className="items-end">
          <Text className="font-caption text-[11px] text-black/40">Risk level</Text>
          <View className="flex-row items-baseline gap-0.5">
            <Text className="font-display text-[28px] text-black" style={{ lineHeight: 32 }}>
              {rule.risk_level}
            </Text>
            <Text className="font-caption text-[13px] text-black/40">/5</Text>
          </View>
        </View>
      </View>

      {/* Risk bar */}
      <View className="mb-5">
        <RiskBar level={rule.risk_level} />
      </View>

      {/* Description */}
      <Text className="mb-5 font-body text-[13px] leading-5 text-black/60">{rule.description}</Text>

      {/* Stock / Bond split */}
      <View className="rounded-2xl bg-white p-4">
        <Text className="mb-3 font-button text-[13px] text-black/50">Asset mix</Text>
        {[
          { label: 'Equities', pct: rule.stock_allocation, color: ACCENT },
          { label: 'Bonds', pct: rule.bond_allocation, color: '#94A3B8' },
        ].map(({ label, pct, color }) => (
          <View key={label} className="mb-3">
            <View className="mb-1.5 flex-row justify-between">
              <Text className="font-body text-[13px] text-black">{label}</Text>
              <Text className="font-button text-[13px] text-black">{pct.toFixed(0)}%</Text>
            </View>
            <View className="h-1.5 overflow-hidden rounded-full bg-gray-100">
              <View
                style={{ width: `${pct}%`, backgroundColor: color }}
                className="h-full rounded-full"
              />
            </View>
          </View>
        ))}
      </View>

      {/* Risk label badge */}
      <View
        className="mt-3 self-start rounded-full px-3 py-1"
        style={{ backgroundColor: `${ACCENT}15` }}>
        <Text className="font-button text-[12px]" style={{ color: ACCENT }}>
          {rule.risk_label}
        </Text>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function InvestmentStashScreen() {
  const insets = useSafeAreaInsets();
  const { impact, selection } = useHaptics();
  const { width: sw, height: sh } = useWindowDimensions();
  const isBalanceVisible = useUIStore((s) => s.isBalanceVisible);

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
    distribution,
    transactions,
    hasMoreTx,
    hasPrevTx,
    currentPage,
    nextPage,
    prevPage,
    refetch,
  } = useInvestmentStashData();

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const isPositive = perfReturnPct >= 0;
  const pctColor = isPositive ? '#16A34A' : '#DC2626';
  const allTimePctLabel = `${netPnlPct >= 0 ? '+' : ''}${netPnlPct.toFixed(2)}%`;
  const chartW = sw - 40;
  const chartH = Math.round(sh / 2);

  return (
    <View className="flex-1 bg-white">
      {/* Header — back button + large inline title */}
      <View className="flex-row items-center px-5 pb-0" style={{ paddingTop: insets.top + 8 }}>
        <Pressable
          onPress={() => {
            impact();
            router.back();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="mr-3 h-9 w-9 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <ChevronLeft size={24} color="#000" strokeWidth={2} />
        </Pressable>
        <Text className="font-headline text-[28px] text-black" style={{ letterSpacing: -0.5 }}>
          Invest
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
        showsVerticalScrollIndicator={false}
        bounces
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* ── Market closed banner ── */}
        <MarketClosedBanner />

        {/* ── Hero balance ── */}
        <View className="px-5 pb-2 pt-3">
          {isLoading ? (
            <View className="gap-2.5">
              <Shimmer w={160} h={52} radius={12} />
              <Shimmer w={100} h={14} />
            </View>
          ) : (
            <Animated.View entering={FadeIn.duration(200)}>
              <Text className="mb-1 font-caption text-[14px] text-black/50">Portfolio value</Text>
              <Text
                className="font-display text-black"
                style={{ fontSize: 48, letterSpacing: -2, lineHeight: 56 }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}>
                {isBalanceVisible ? totalBalance : '••••'}
              </Text>
              {perfReturn ? (
                <Text className="mt-1 font-body text-[13px]" style={{ color: pctColor }}>
                  {isPositive ? '↑' : '↓'} {isBalanceVisible ? perfReturn : '••••'} (
                  {isPositive ? '+' : ''}
                  {perfReturnPct.toFixed(2)}%) · {period}
                </Text>
              ) : (
                <Text className="mt-1 font-body text-[13px] text-black/40">
                  {allTimePctLabel} all time
                </Text>
              )}
              <View className="mt-3 flex-row gap-4">
                <View>
                  <Text className="font-caption text-[11px] text-black/40">Invested</Text>
                  <Text className="mt-0.5 font-button text-[14px] text-black">
                    {isBalanceVisible ? investedValue : '••••'}
                  </Text>
                </View>
                <View className="w-px bg-gray-100" />
                <View>
                  <Text className="font-caption text-[11px] text-black/40">Buying power</Text>
                  <Text className="mt-0.5 font-button text-[14px] text-black">
                    {isBalanceVisible ? buyingPower : '••••'}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}
        </View>

        {/* ── Chart ── */}
        <View className="mt-4 px-5">
          {perfLoading || isLoading ? (
            <Shimmer w="100%" h={chartH} radius={8} />
          ) : chartPoints.length >= 2 ? (
            <Animated.View entering={FadeIn.duration(300)}>
              <PortfolioChart
                points={chartPoints}
                isPositive={isPositive}
                width={chartW}
                height={chartH}
              />
            </Animated.View>
          ) : (
            <View style={{ height: chartH }} className="items-center justify-center">
              <Text className="font-caption text-[12px] text-black/30">No chart data yet</Text>
            </View>
          )}
        </View>

        {/* ── Period selector ── */}
        <View className="mb-6 mt-3 px-5">
          <PeriodSelector
            selected={period}
            onSelect={(p) => {
              selection();
              setPeriod(p);
            }}
          />
        </View>

        {/* ── Holdings ── */}
        <View className="mb-6 px-5">
          <Text className="mb-3.5 font-headline text-xl text-black">Holdings</Text>
          <View className="overflow-hidden rounded-[20px] bg-gray-50">
            {isLoading ? (
              [0, 1, 2].map((i) => (
                <View key={i} className="flex-row items-center gap-3.5 p-4">
                  <Shimmer w={44} h={44} radius={22} />
                  <View className="flex-1 gap-2">
                    <Shimmer w="40%" h={14} />
                    <Shimmer w="25%" h={11} />
                  </View>
                  <View className="items-end gap-2">
                    <Shimmer w={60} h={14} />
                    <Shimmer w={40} h={11} />
                  </View>
                </View>
              ))
            ) : positions.length === 0 ? (
              <View className="items-center py-10">
                <Text className="font-caption text-[14px] text-black/40">No holdings yet</Text>
                <Text className="mt-1 font-caption text-[12px] text-black/30">
                  Auto-invest will place orders soon
                </Text>
              </View>
            ) : (
              positions.map((pos, i) => (
                <AssetRow key={pos.id} position={pos} showSep={i < positions.length - 1} />
              ))
            )}
          </View>
        </View>

        {/* ── Transactions ── */}
        <View className="mb-6 px-5">
          <View className="mb-3.5 flex-row items-center justify-between">
            <Text className="font-headline text-xl text-black">Transactions</Text>
            {(hasPrevTx || hasMoreTx) && (
              <Text className="font-caption text-[12px] text-black/40">Page {currentPage}</Text>
            )}
          </View>
          <View className="overflow-hidden rounded-[20px] bg-gray-50 px-4">
            {txLoading ? (
              [0, 1, 2].map((i) => <TransactionItemSkeleton key={i} />)
            ) : transactions.length === 0 ? (
              <View className="items-center py-10">
                <Text className="font-caption text-[14px] text-black/40">No transactions yet</Text>
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
                className={`flex-row items-center gap-1 rounded-xl px-4 py-2.5 ${hasPrevTx ? 'bg-gray-100' : 'opacity-0'}`}>
                <ChevronLeft size={16} color="#000" strokeWidth={2} />
                <Text className="font-button text-[13px] text-black">Prev</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  impact();
                  nextPage();
                }}
                disabled={!hasMoreTx}
                className={`flex-row items-center gap-1 rounded-xl px-4 py-2.5 ${hasMoreTx ? 'bg-gray-100' : 'opacity-0'}`}>
                <Text className="font-button text-[13px] text-black">Next</Text>
                <ChevronRight size={16} color="#000" strokeWidth={2} />
              </Pressable>
            </View>
          )}
        </View>

        {/* ── Allocation ── */}
        {(isLoading || distribution.length > 0) && (
          <View className="mb-6 px-5">
            <Text className="mb-3.5 font-headline text-xl text-black">Allocation</Text>
            <View className="overflow-hidden rounded-[20px] bg-gray-50 px-4 pt-4">
              {isLoading ? (
                <View className="gap-3 pb-4">
                  <Shimmer w="100%" h={8} radius={4} />
                  {[0, 1, 2].map((i) => (
                    <View key={i} className="flex-row items-center gap-3 py-1">
                      <Shimmer w={10} h={10} radius={5} />
                      <Shimmer w="30%" h={13} />
                      <View className="flex-1" />
                      <Shimmer w={50} h={13} />
                      <Shimmer w={40} h={13} />
                    </View>
                  ))}
                </View>
              ) : (
                <>
                  <AllocationBar items={distribution} />
                  <View className="mb-1 flex-row pb-1">
                    <Text className="flex-1 font-caption text-[11px] text-black/40">Asset</Text>
                    <Text className="mr-4 font-caption text-[11px] text-black/40">Value</Text>
                    <Text className="w-14 text-right font-caption text-[11px] text-black/40">
                      Weight
                    </Text>
                  </View>
                  {distribution.map((item, i) => (
                    <AllocationRow
                      key={item.symbol}
                      item={item}
                      index={i}
                      showSep={i < distribution.length - 1}
                    />
                  ))}
                  <View className="pb-2" />
                </>
              )}
            </View>
          </View>
        )}

        {/* ── Investment rule ── */}
        <View className="mb-6 px-5">
          <Text className="mb-3.5 font-headline text-xl text-black">Investment rule</Text>
          {isLoading ? (
            <View className="gap-3 rounded-[20px] bg-gray-50 p-5">
              <Shimmer w="60%" h={20} />
              <Shimmer w="40%" h={14} />
              <Shimmer w="100%" h={10} radius={5} />
              <Shimmer w="100%" h={48} />
            </View>
          ) : investmentRule ? (
            <Animated.View entering={FadeIn.duration(200)}>
              <InvestmentRuleCard rule={investmentRule} />
            </Animated.View>
          ) : (
            <View className="items-center rounded-[20px] bg-gray-50 py-10">
              <Text className="font-caption text-[14px] text-black/40">
                Strategy not yet assigned
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
