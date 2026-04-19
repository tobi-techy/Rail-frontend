import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import Animated, { FadeInUp } from 'react-native-reanimated';
import type { InsightCard } from '@/api/types/ai';

const F = 'SFProDisplay';
const M = 'SFMono';
const P = '#1A1A1A';
const S = '#8C8C8C';
const A = '#FF2E01';
const COLORS = ['#FF2E01', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#00BCD4'];
const W = Dimensions.get('window').width;

function CardWrapper({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <Animated.View
      entering={FadeInUp.duration(300).delay(delay)}
      style={{
        marginTop: 12,
        paddingVertical: 4,
      }}>
      {children}
    </Animated.View>
  );
}

function CardTitle({ title, subtitle, sentiment }: { title: string; subtitle?: string; sentiment?: string }) {
  const color = sentiment === 'positive' ? '#16A34A' : sentiment === 'negative' ? '#DC2626' : A;
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontFamily: `${F}-Medium`, fontSize: 13, color: S, letterSpacing: 0.3 }}>{title}</Text>
      {subtitle && (
        <Text style={{ fontFamily: `${M}-Bold`, fontSize: 20, color, marginTop: 4, letterSpacing: -0.5 }}>{subtitle}</Text>
      )}
    </View>
  );
}

function StatGrid({ card }: { card: InsightCard }) {
  const items = Array.isArray(card.data) ? card.data : [];
  return (
    <CardWrapper>
      <CardTitle title={card.title} subtitle={card.subtitle} sentiment={card.sentiment} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {items.map((item: any, i: number) => {
          const sc = item.sentiment === 'positive' ? '#16A34A' : item.sentiment === 'negative' ? '#DC2626' : P;
          return (
            <View key={i} style={{ minWidth: 90, paddingVertical: 8 }}>
              <Text style={{ fontFamily: `${F}-Regular`, fontSize: 11, color: S, marginBottom: 4 }}>
                {item.icon ? `${item.icon} ` : ''}{item.label}
              </Text>
              <Text style={{ fontFamily: `${M}-Bold`, fontSize: 22, color: sc, letterSpacing: -0.5 }}>
                {item.value}
              </Text>
              {item.change && (
                <Text style={{ fontFamily: `${M}-Medium`, fontSize: 12, color: sc, marginTop: 2 }}>{item.change}</Text>
              )}
            </View>
          );
        })}
      </View>
    </CardWrapper>
  );
}

function ChartCard({ card }: { card: InsightCard }) {
  const chartData = card.data as any;
  if (!chartData?.points?.length) return null;

  const chartWidth = W - 100;
  const points = chartData.points.map((p: any, i: number) => ({
    value: parseFloat(p.value) || 0,
    label: p.label,
    frontColor: COLORS[i % COLORS.length],
  }));

  const sc = card.sentiment === 'positive' ? '#16A34A' : card.sentiment === 'negative' ? '#DC2626' : A;

  return (
    <CardWrapper>
      <CardTitle title={card.title} subtitle={card.subtitle} sentiment={card.sentiment} />
      {chartData.chart_type === 'bar' ? (
        <BarChart
          data={points}
          width={chartWidth}
          height={150}
          barWidth={Math.min(28, chartWidth / points.length - 8)}
          spacing={Math.max(8, chartWidth / points.length - 28)}
          noOfSections={4}
          barBorderRadius={6}
          yAxisThickness={0}
          xAxisThickness={0}
          hideRules
          xAxisLabelTextStyle={{ fontFamily: `${F}-Regular`, fontSize: 9, color: S }}
          yAxisTextStyle={{ fontFamily: `${M}-Regular`, fontSize: 9, color: S }}
          isAnimated
          animationDuration={600}
        />
      ) : (
        <LineChart
          data={points.map((p: any) => ({ value: p.value, label: p.label }))}
          width={chartWidth}
          height={150}
          color={sc}
          thickness={2.5}
          noOfSections={4}
          yAxisThickness={0}
          xAxisThickness={0}
          hideRules
          dataPointsColor={sc}
          dataPointsRadius={4}
          curved
          areaChart
          startFillColor={sc}
          startOpacity={0.12}
          endOpacity={0}
          xAxisLabelTextStyle={{ fontFamily: `${F}-Regular`, fontSize: 9, color: S }}
          yAxisTextStyle={{ fontFamily: `${M}-Regular`, fontSize: 9, color: S }}
          isAnimated
          animationDuration={800}
        />
      )}
    </CardWrapper>
  );
}

function BreakdownCard({ card }: { card: InsightCard }) {
  const items = Array.isArray(card.data) ? card.data : [];
  const total = items.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0);

  return (
    <CardWrapper>
      <CardTitle title={card.title} subtitle={card.subtitle} sentiment={card.sentiment} />
      {/* Mini bar visualization */}
      {total > 0 && (
        <View style={{ flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
          {items.map((item: any, i: number) => {
            const pct = (parseFloat(item.amount) || 0) / total;
            return <View key={i} style={{ flex: pct, backgroundColor: item.color || COLORS[i % COLORS.length] }} />;
          })}
        </View>
      )}
      {items.map((item: any, i: number) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: i < items.length - 1 ? 1 : 0, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.color || COLORS[i % COLORS.length] }} />
            <Text style={{ fontFamily: `${F}-Regular`, fontSize: 14, color: P, flex: 1 }} numberOfLines={1}>{item.label}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: `${M}-Semibold`, fontSize: 15, color: P }}>${parseFloat(item.amount).toFixed(2)}</Text>
            {item.percent != null && (
              <Text style={{ fontFamily: `${M}-Regular`, fontSize: 11, color: S }}>{parseFloat(item.percent).toFixed(1)}%</Text>
            )}
          </View>
        </View>
      ))}
    </CardWrapper>
  );
}

function ProgressCard({ card }: { card: InsightCard }) {
  const data = card.data as any;
  const current = parseFloat(data?.current) || 0;
  const target = parseFloat(data?.target) || 1;
  const pct = Math.min(current / target, 1);

  return (
    <CardWrapper>
      <CardTitle title={card.title} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontFamily: `${M}-Bold`, fontSize: 18, color: P }}>${current.toFixed(2)}</Text>
        <Text style={{ fontFamily: `${M}-Regular`, fontSize: 14, color: S }}>${target.toFixed(2)}</Text>
      </View>
      <View style={{ height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ height: 8, width: `${pct * 100}%`, backgroundColor: pct >= 1 ? '#16A34A' : A, borderRadius: 4 }} />
      </View>
      <Text style={{ fontFamily: `${F}-Regular`, fontSize: 12, color: S, marginTop: 6, textAlign: 'center' }}>
        {(pct * 100).toFixed(0)}% complete
      </Text>
    </CardWrapper>
  );
}

function AlertCard({ card }: { card: InsightCard }) {
  const isNeg = card.sentiment === 'negative';
  const bg = isNeg ? '#FEF2F2' : card.sentiment === 'positive' ? '#F0FDF4' : '#FFF7ED';
  const border = isNeg ? '#FECACA' : card.sentiment === 'positive' ? '#BBF7D0' : '#FED7AA';
  const textColor = isNeg ? '#991B1B' : card.sentiment === 'positive' ? '#166534' : '#92400E';

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      style={{
        backgroundColor: bg,
        borderRadius: 14,
        padding: 14,
        marginTop: 12,
        borderWidth: 1,
        borderColor: border,
      }}>
      <Text style={{ fontFamily: `${F}-Semibold`, fontSize: 14, color: textColor }}>{card.title}</Text>
      {card.subtitle && (
        <Text style={{ fontFamily: `${F}-Regular`, fontSize: 13, color: textColor, marginTop: 4, opacity: 0.85 }}>{card.subtitle}</Text>
      )}
    </Animated.View>
  );
}

function HighlightCard({ card }: { card: InsightCard }) {
  return (
    <CardWrapper>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <View style={{ width: 4, height: 20, borderRadius: 2, backgroundColor: A }} />
        <Text style={{ fontFamily: `${F}-Semibold`, fontSize: 15, color: P }}>{card.title}</Text>
      </View>
      {card.subtitle && (
        <Text style={{ fontFamily: `${F}-Regular`, fontSize: 14, color: S, marginTop: 4, paddingLeft: 12 }}>{card.subtitle}</Text>
      )}
    </CardWrapper>
  );
}

export function InsightCardView({ card }: { card: InsightCard }) {
  switch (card.type) {
    case 'stat_grid':
      return <StatGrid card={card} />;
    case 'chart':
      return <ChartCard card={card} />;
    case 'breakdown':
      return <BreakdownCard card={card} />;
    case 'progress':
      return <ProgressCard card={card} />;
    case 'alert':
      return <AlertCard card={card} />;
    case 'highlight':
      return <HighlightCard card={card} />;
    default:
      return <HighlightCard card={card} />;
  }
}
