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
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react-native';
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

// ─── Design tokens ────────────────────────────────────────────────────────────
const ACCENT = '#6366F1';
const GREEN = '#16A34A';
const RED = '#DC2626';
const ALLOC_COLORS = ['#6366F1', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];
const PERIODS: InvestmentPeriod[] = ['1W', '1M', '3M', '6M', '1Y', 'ALL'];

// ─── Shimmer ──────────────────────────────────────────────────────────────────
function Shimmer({ w, h, radius = 8 }: { w: number | `${number}%`; h: number; radius?: number }) {
  return (
    <View
      style={{ width: w as any, height: h, borderRadius: radius, backgroundColor: '#F3F4F6' }}
    />
  );
}

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
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}>
      {PERIODS.map((p) => {
        const active = p === selected;
        return (
          <Pressable
            key={p}
            onPress={() => onSelect(p)}
            accessibilityRole="button"
            accessibilityLabel={`${p} period`}
            style={{
              minWidth: 44,
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 22,
              backgroundColor: active ? '#111827' : 'transparent',
              paddingHorizontal: 8,
            }}>
            <Text
              style={{
                fontSize: 13,
                fontFamily: active ? 'SF-Pro-Rounded-Semibold' : 'SF-Pro-Rounded-Regular',
                color: active ? '#FFFFFF' : '#9CA3AF',
              }}>
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
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
      }}>
      <Text style={{ fontSize: 14, fontFamily: 'SF-Pro-Rounded-Regular', color: '#6B7280' }}>
        {label}
      </Text>
      <Text style={{ fontSize: 14, fontFamily: 'SF-Pro-Rounded-Semibold', color: '#111827' }}>
        {value}
      </Text>
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
    <View
      style={{
        marginHorizontal: 16,
        borderRadius: 16,
      }}>
      <StatsRow label="Invested" value={hidden ? mask : investedValue} />
      <View style={{ height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 }} />
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

// ─── Pending orders banner ────────────────────────────────────────────────────
function PendingOrdersBanner({ transactions }: { transactions: InvestmentTradeTransaction[] }) {
  const pending = transactions.filter((t) => t.status !== 'filled' && t.status !== 'canceled');
  if (!pending.length) return null;
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={{
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 12,
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT }} />
      <Text style={{ fontSize: 13, fontFamily: 'SF-Pro-Rounded-Regular', color: ACCENT, flex: 1 }}>
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
    <View style={{ marginTop: 32, paddingHorizontal: 16 }}>
      <Text
        style={{
          fontSize: 18,
          fontFamily: 'SF-Pro-Rounded-Semibold',
          color: '#111827',
          marginBottom: 16,
        }}>
        Allocation
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
        {/* Donut */}
        <DonutChart items={items} />
        {/* Legend */}
        <View style={{ flex: 1, gap: 10 }}>
          {items.map((item, i) => (
            <View key={item.symbol} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: ALLOC_COLORS[i % ALLOC_COLORS.length],
                }}
              />
              <Text
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontFamily: 'SF-Pro-Rounded-Regular',
                  color: '#374151',
                }}
                numberOfLines={1}>
                {item.symbol}
              </Text>
              <Text
                style={{ fontSize: 13, fontFamily: 'SF-Pro-Rounded-Semibold', color: '#111827' }}>
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
    <View style={{ marginTop: 32, paddingHorizontal: 16 }}>
      <Text
        style={{
          fontSize: 18,
          fontFamily: 'SF-Pro-Rounded-Semibold',
          color: '#111827',
          marginBottom: 16,
        }}>
        Investment rule
      </Text>
      <View
        style={{
          borderRadius: 16,
          backgroundColor: '#F9FAFB',
          borderWidth: 1,
          borderColor: '#F3F4F6',
          padding: 16,
        }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
          }}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={{ fontSize: 16, fontFamily: 'SF-Pro-Rounded-Semibold', color: '#111827' }}>
              {rule.strategy_name}
            </Text>
            {rule.age_used !== null && (
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'SF-Pro-Rounded-Regular',
                  color: '#9CA3AF',
                  marginTop: 4,
                }}>
                Based on age {rule.age_used}
              </Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 11, fontFamily: 'SF-Pro-Rounded-Regular', color: '#9CA3AF' }}>
              Risk level
            </Text>
            <Text
              style={{
                fontSize: 28,
                fontFamily: 'SF-Pro-Rounded-Semibold',
                color: '#111827',
                lineHeight: 32,
              }}>
              {rule.risk_level}
              <Text style={{ fontSize: 13, color: '#9CA3AF' }}>/5</Text>
            </Text>
          </View>
        </View>
        {/* Risk bar */}
        <View
          style={{
            height: 8,
            flexDirection: 'row',
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: 4,
          }}>
          {RISK_COLORS.map((c, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: c }} />
          ))}
        </View>
        <View
          style={{ paddingLeft: `${((rule.risk_level - 1) / 4) * 88}%` as any, marginBottom: 16 }}>
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: '#111827',
              borderWidth: 2,
              borderColor: '#FFFFFF',
            }}
          />
        </View>
        <Text
          style={{
            fontSize: 13,
            fontFamily: 'SF-Pro-Rounded-Regular',
            color: '#6B7280',
            lineHeight: 20,
            marginBottom: 16,
          }}>
          {rule.description}
        </Text>
        {/* Asset mix */}
        {[
          { label: 'Equities', pct: rule.stock_allocation, color: ACCENT },
          { label: 'Bonds', pct: rule.bond_allocation, color: '#94A3B8' },
        ].map(({ label, pct, color }) => (
          <View key={label} style={{ marginBottom: 12 }}>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text
                style={{ fontSize: 13, fontFamily: 'SF-Pro-Rounded-Regular', color: '#374151' }}>
                {label}
              </Text>
              <Text
                style={{ fontSize: 13, fontFamily: 'SF-Pro-Rounded-Semibold', color: '#111827' }}>
                {pct.toFixed(0)}%
              </Text>
            </View>
            <View
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: '#E5E7EB',
                overflow: 'hidden',
              }}>
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
          style={{
            alignSelf: 'flex-start',
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 4,
            backgroundColor: `${ACCENT}15`,
            marginTop: 4,
          }}>
          <Text style={{ fontSize: 12, fontFamily: 'SF-Pro-Rounded-Semibold', color: ACCENT }}>
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
    await refetch();
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
          <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 }}>
            {isLoading ? (
              <View style={{ gap: 8 }}>
                <Shimmer w={140} h={48} radius={10} />
                <Shimmer w={180} h={16} />
              </View>
            ) : (
              <Animated.View entering={FadeIn.duration(200)}>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'SF-Pro-Rounded-Regular',
                    color: '#9CA3AF',
                    marginBottom: 4,
                  }}>
                  Portfolio value
                </Text>
                <Text
                  style={{
                    fontSize: 44,
                    fontFamily: 'SF-Pro-Rounded-Semibold',
                    color: '#111827',
                    letterSpacing: -1.5,
                    lineHeight: 52,
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}>
                  {isBalanceVisible ? totalBalance : mask}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 }}>
                  {isPositive ? (
                    <TrendingUp size={14} color={pnlColor} strokeWidth={2} />
                  ) : (
                    <TrendingDown size={14} color={pnlColor} strokeWidth={2} />
                  )}
                  <Text
                    style={{ fontSize: 14, fontFamily: 'SF-Pro-Rounded-Regular', color: pnlColor }}>
                    {isBalanceVisible
                      ? `${perfReturn ? perfReturn + ' ' : ''}(${isPositive ? '+' : ''}${perfReturnPct.toFixed(2)}%)`
                      : mask}{' '}
                    <Text style={{ color: '#9CA3AF' }}>· {period}</Text>
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
          <View style={{ marginTop: 8 }}>
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
              <View style={{ height: chartH, alignItems: 'center', justifyContent: 'center' }}>
                <Text
                  style={{ fontSize: 13, fontFamily: 'SF-Pro-Rounded-Regular', color: '#D1D5DB' }}>
                  No chart data yet
                </Text>
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
          <View style={{ marginHorizontal: 16, gap: 1 }}>
            <Shimmer w="100%" h={48} radius={16} />
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
          <View style={{ marginTop: 32, paddingHorizontal: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'SF-Pro-Rounded-Semibold',
                  color: '#111827',
                }}>
                Holdings
              </Text>
              {showAllHoldings && !isLoading && !positionsLoading && (
                <Pressable
                  onPress={() => {
                    impact();
                    router.push('/investment-stash/holdings');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="View all holdings"
                  style={{
                    borderRadius: 12,
                    backgroundColor: '#F3F4F6',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'SF-Pro-Rounded-Semibold',
                      color: '#111827',
                    }}>
                    View all
                  </Text>
                </Pressable>
              )}
            </View>
            <View
              style={{
                borderRadius: 16,
                overflow: 'hidden',
              }}>
              {isLoading || positionsLoading ? (
                [0, 1, 2].map((i) => (
                  <View
                    key={i}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
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
                ))
              ) : previewPositions.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'SF-Pro-Rounded-Regular',
                      color: '#9CA3AF',
                    }}>
                    No holdings yet
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'SF-Pro-Rounded-Regular',
                      color: '#D1D5DB',
                      marginTop: 4,
                    }}>
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
                        params: { position: JSON.stringify(pos) },
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
          <View style={{ marginTop: 32, paddingHorizontal: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}>
              <Text
                style={{ fontSize: 18, fontFamily: 'SF-Pro-Rounded-Semibold', color: '#111827' }}>
                Transactions
              </Text>
              {(hasPrevTx || hasMoreTx) && (
                <Text
                  style={{ fontSize: 12, fontFamily: 'SF-Pro-Rounded-Regular', color: '#9CA3AF' }}>
                  Page {currentPage}
                </Text>
              )}
            </View>
            <View
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                paddingHorizontal: 4,
              }}>
              {txLoading ? (
                [0, 1, 2].map((i) => <TransactionItemSkeleton key={i} />)
              ) : transactions.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'SF-Pro-Rounded-Regular',
                      color: '#9CA3AF',
                    }}>
                    No transactions yet
                  </Text>
                </View>
              ) : (
                transactions.map((tx) => <TradeRow key={tx.id} tx={tx} />)
              )}
            </View>
            {(hasPrevTx || hasMoreTx) && (
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <Pressable
                  onPress={() => {
                    impact();
                    prevPage();
                  }}
                  disabled={!hasPrevTx}
                  accessibilityRole="button"
                  accessibilityLabel="Previous page"
                  style={{
                    opacity: hasPrevTx ? 1 : 0,
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
                <Pressable
                  onPress={() => {
                    impact();
                    nextPage();
                  }}
                  disabled={!hasMoreTx}
                  accessibilityRole="button"
                  accessibilityLabel="Next page"
                  style={{
                    opacity: hasMoreTx ? 1 : 0,
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
            )}
          </View>
        );

      case 'allocation':
        return isLoading || distribution.length > 0 ? (
          isLoading ? (
            <View style={{ marginTop: 32, paddingHorizontal: 16, gap: 8 }}>
              <Shimmer w={100} h={20} />
              <Shimmer w="100%" h={8} radius={4} />
              <Shimmer w="100%" h={48} radius={16} />
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
                <Shimmer w={120} h={20} />
                <Shimmer w="100%" h={160} radius={16} />
              </View>
            ) : investmentRule ? (
              <Animated.View entering={FadeIn.duration(200)}>
                <InvestmentRuleSection rule={investmentRule} />
              </Animated.View>
            ) : null}
          </View>
        );

      case 'footer':
        return <View style={{ height: 48 }} />;

      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
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
        <Text style={{ fontSize: 17, fontFamily: 'SF-Pro-Rounded-Semibold', color: '#111827' }}>
          Invest
        </Text>
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
