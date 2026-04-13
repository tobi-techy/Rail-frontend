import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import type { InsightCard } from '@/api/types/ai';

const DISPLAY = 'SFProDisplay';
const MONO = 'SFMono';
const TEXT_PRIMARY = '#1A1A1A';
const TEXT_SECONDARY = '#8C8C8C';
const ACCENT = '#FF2E01';
const CHART_COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];
const SCREEN_W = Dimensions.get('window').width;

function StatGrid({ card }: { card: InsightCard }) {
  const items = Array.isArray(card.data) ? card.data : [];
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ fontFamily: `${DISPLAY}-Medium`, fontSize: 13, color: TEXT_SECONDARY, letterSpacing: 0.3, marginBottom: 12 }}>
        {card.title}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
        {items.map((item: any, i: number) => {
          const sentimentColor = item.sentiment === 'positive' ? '#16A34A' : item.sentiment === 'negative' ? '#DC2626' : TEXT_PRIMARY;
          return (
            <View key={i} style={{ minWidth: 80 }}>
              <Text style={{ fontFamily: `${DISPLAY}-Regular`, fontSize: 11, color: TEXT_SECONDARY, marginBottom: 2 }}>
                {item.icon ? `${item.icon} ` : ''}{item.label}
              </Text>
              <Text style={{ fontFamily: `${MONO}-Semibold`, fontSize: 22, color: sentimentColor, letterSpacing: -0.5 }}>
                {item.value}
              </Text>
              {item.change && (
                <Text style={{ fontFamily: `${MONO}-Medium`, fontSize: 12, color: sentimentColor, marginTop: 1 }}>
                  {item.change}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ChartCard({ card }: { card: InsightCard }) {
  const chartData = card.data as any;
  if (!chartData?.points?.length) return null;

  const chartWidth = SCREEN_W - 80;
  const points = chartData.points.map((p: any, i: number) => ({
    value: parseFloat(p.value) || 0,
    label: p.label,
    frontColor: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const sentimentColor = card.sentiment === 'positive' ? '#16A34A' : card.sentiment === 'negative' ? '#DC2626' : ACCENT;

  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ fontFamily: `${DISPLAY}-Medium`, fontSize: 13, color: TEXT_SECONDARY, letterSpacing: 0.3 }}>
        {card.title}
      </Text>
      {card.subtitle && (
        <Text style={{ fontFamily: `${MONO}-Semibold`, fontSize: 16, color: sentimentColor, marginTop: 4 }}>
          {card.subtitle}
        </Text>
      )}
      <View style={{ marginTop: 12 }}>
        {chartData.chart_type === 'bar' ? (
          <BarChart
            data={points}
            width={chartWidth}
            height={160}
            barWidth={Math.min(24, chartWidth / points.length - 8)}
            spacing={Math.max(8, chartWidth / points.length - 24)}
            noOfSections={4}
            barBorderRadius={4}
            yAxisThickness={0}
            xAxisThickness={0}
            hideRules
            xAxisLabelTextStyle={{ fontFamily: `${DISPLAY}-Regular`, fontSize: 9, color: TEXT_SECONDARY }}
            yAxisTextStyle={{ fontFamily: `${MONO}-Regular`, fontSize: 9, color: TEXT_SECONDARY }}
            isAnimated
            animationDuration={600}
          />
        ) : (
          <LineChart
            data={points.map((p: any) => ({ value: p.value, label: p.label }))}
            width={chartWidth}
            height={160}
            color={sentimentColor}
            thickness={2}
            noOfSections={4}
            yAxisThickness={0}
            xAxisThickness={0}
            hideRules
            hideDataPoints={false}
            dataPointsColor={sentimentColor}
            dataPointsRadius={3}
            curved
            areaChart
            startFillColor={sentimentColor}
            startOpacity={0.15}
            endOpacity={0}
            xAxisLabelTextStyle={{ fontFamily: `${DISPLAY}-Regular`, fontSize: 9, color: TEXT_SECONDARY }}
            yAxisTextStyle={{ fontFamily: `${MONO}-Regular`, fontSize: 9, color: TEXT_SECONDARY }}
            isAnimated
            animationDuration={800}
          />
        )}
      </View>
    </View>
  );
}

function BreakdownCard({ card }: { card: InsightCard }) {
  const items = Array.isArray(card.data) ? card.data : [];
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ fontFamily: `${DISPLAY}-Medium`, fontSize: 13, color: TEXT_SECONDARY, letterSpacing: 0.3, marginBottom: 8 }}>
        {card.title}
      </Text>
      {items.map((item: any, i: number) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.color || CHART_COLORS[i % CHART_COLORS.length] }} />
            <Text style={{ fontFamily: `${DISPLAY}-Regular`, fontSize: 14, color: TEXT_PRIMARY, flex: 1 }} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: `${MONO}-Semibold`, fontSize: 15, color: TEXT_PRIMARY }}>
              ${parseFloat(item.amount).toFixed(2)}
            </Text>
            {item.percent != null && (
              <Text style={{ fontFamily: `${MONO}-Regular`, fontSize: 11, color: TEXT_SECONDARY }}>
                {parseFloat(item.percent).toFixed(1)}%
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
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
    default:
      return (
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontFamily: `${DISPLAY}-Medium`, fontSize: 13, color: TEXT_SECONDARY }}>{card.title}</Text>
          {card.subtitle && <Text style={{ fontFamily: `${DISPLAY}-Regular`, fontSize: 14, color: TEXT_PRIMARY, marginTop: 4 }}>{card.subtitle}</Text>}
        </View>
      );
  }
}
