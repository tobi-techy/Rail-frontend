import React from 'react';
import { View, Text } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { CardContainer, CardErrorFallback, type InsightCard } from './shared';

export function ChartCard({ card }: { card: InsightCard }) {
  const raw = (card.data?.points ?? card.data?.data ?? (Array.isArray(card.data) ? card.data : undefined)) as
    | { label: string; value: number }[]
    | undefined;

  if (!Array.isArray(raw) || raw.length === 0) return <CardErrorFallback />;

  const barData = raw.map((d) => ({ label: d.label, value: d.value, frontColor: '#ff3e00' }));
  const isBar = (card.data?.chartType as string) === 'bar' || (card.data?.chart_type as string) === 'bar' || raw.length <= 7;

  return (
    <CardContainer>
      <View className="py-2">
        {card.title && <Text className="mb-3 font-heading-semibold text-base text-text-primary">{card.title}</Text>}
        <View className="items-center">
          {isBar ? (
            <BarChart data={barData} barWidth={26} spacing={16} height={180} barBorderRadius={8} yAxisTextStyle={{ fontSize: 11, color: '#8C8C8C' }} hideRules hideYAxisText isAnimated animationDuration={600} />
          ) : (
            <LineChart data={raw.map((d) => ({ label: d.label, value: d.value }))} height={180} color="#ff3e00" thickness={3} dataPointsColor="#ff3e00" dataPointsRadius={4} yAxisTextStyle={{ fontSize: 11, color: '#8C8C8C' }} hideRules isAnimated animationDuration={600} />
          )}
        </View>
      </View>
    </CardContainer>
  );
}

export function BreakdownCard({ card }: { card: InsightCard }) {
  const items = (Array.isArray(card.data) ? card.data : card.data?.items) as
    | { label: string; value?: string; amount?: number; percent?: number; color?: string }[]
    | undefined;

  if (!Array.isArray(items) || items.length === 0) return <CardErrorFallback />;

  const COLORS = ['#ff3e00', '#FF6B4A', '#FFB199', '#1A7A6D', '#4ECDC4', '#95E1D3', '#8C8C8C'];
  const pieData = items.map((item, i) => ({
    value: item.amount !== undefined && item.amount !== null
      ? Number(item.amount)
      : parseFloat((item.value ?? '0').replace(/[^0-9.]/g, '')) || 0,
    color: item.color ?? COLORS[i % COLORS.length],
    text: '',
  }));
  const total = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <CardContainer>
      <View className="py-2">
        {card.title && <Text className="mb-4 font-heading-semibold text-base text-text-primary">{card.title}</Text>}
        <View className="flex-row items-center">
          <PieChart
            data={pieData}
            donut
            radius={68}
            innerRadius={44}
            innerCircleColor="#FAFAF8"
            isAnimated
            animationDuration={600}
            centerLabelComponent={() => (
              <Text className="font-heading-bold text-[15px] text-text-primary">${total.toFixed(0)}</Text>
            )}
          />
          <View className="ml-5 flex-1 gap-2.5">
            {items.map((item, i) => {
              const amt = item.amount !== undefined && item.amount !== null
                ? Number(item.amount)
                : parseFloat((item.value ?? '0').replace(/[^0-9.]/g, '')) || 0;
              return (
                <View key={i} className="flex-row items-center">
                  <View className="mr-2.5 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color ?? COLORS[i % COLORS.length] }} />
                  <Text className="flex-1 font-body text-[13px] text-text-secondary">{item.label}</Text>
                  <Text className="font-body-medium text-[13px] text-text-primary">${amt.toFixed(2)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </CardContainer>
  );
}
