import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { InsightCardView } from '@/components/ai/InsightCardView';
import { ANALYTICS_EVENTS } from '@/utils/analytics';
import type { InsightCard } from '@/api/types/ai';

const mockTrack = jest.fn();

jest.mock('@/utils/analytics', () => ({
  ANALYTICS_EVENTS: {
    FINANCIAL_AUDIT_RENDERED: 'financial_audit_rendered',
    FINANCIAL_AUDIT_ACTION_TAPPED: 'financial_audit_action_tapped',
  },
  useAnalytics: () => ({ track: mockTrack }),
}));

jest.mock('react-native-gifted-charts', () => ({
  BarChart: () => null,
  LineChart: () => null,
  PieChart: () => null,
}));

describe('InsightCardView financial audit card', () => {
  beforeEach(() => {
    mockTrack.mockClear();
  });

  it('renders audit details and tracks action taps', () => {
    const card: InsightCard = {
      type: 'financial_audit',
      title: 'Miriam Audit',
      sentiment: 'negative',
      data: {
        score: { total: 42, status: 'needs_attention' },
        period: { label: 'Last 90 days (Feb 6 to May 7, 2026)' },
        data_coverage: { months_analyzed: 3, average_monthly_money_out: '410.00' },
        snapshot: {
          money_in: '1500.00',
          digital_money_out: '1160.00',
          receipt_cash_out: '70.00',
          total_money_out: '1230.00',
        },
        monthly_trend: [
          { label: 'Feb 2026', money_out: '320.00', net_flow: '80.00' },
          { label: 'Mar 2026', money_out: '430.00', net_flow: '-30.00' },
          { label: 'Apr 2026', money_out: '480.00', net_flow: '-120.00' },
        ],
        damage: { primary_issue: 'Eating out is carrying the damage this month.' },
        metrics: [{ label: 'Net flow', value: '-$120.00', sentiment: 'negative' }],
        top_categories: [{ category: 'food_delivery', total: '240.00' }],
        contradictions: [
          { code: 'cash_leak', take: 'You said saving matters, but spend says no.' },
        ],
        patterns: ['Weekend spending spikes.'],
        risk_flags: [{ code: 'low_buffer', title: 'Low buffer', severity: 'high' }],
        next_actions: [{ title: 'Freeze food delivery for 7 days' }],
      },
    };

    const { getByText, getByLabelText } = render(<InsightCardView card={card} />);

    expect(getByText('Miriam Audit')).toBeTruthy();
    expect(getByText('needs attention')).toBeTruthy();
    expect(getByText('Last 90 days (Feb 6 to May 7, 2026)')).toBeTruthy();
    expect(getByText('Money in')).toBeTruthy();
    expect(getByText('Monthly money out')).toBeTruthy();
    expect(getByText('Avg $410')).toBeTruthy();
    expect(getByText('Eating out is carrying the damage this month.')).toBeTruthy();
    expect(getByText('Freeze food delivery for 7 days')).toBeTruthy();
    expect(mockTrack).toHaveBeenCalledWith(ANALYTICS_EVENTS.FINANCIAL_AUDIT_RENDERED, {
      score: 42,
      sentiment: 'negative',
      action_count: 1,
      risk_count: 1,
    });

    fireEvent.press(getByLabelText('Audit action 1'));

    expect(mockTrack).toHaveBeenCalledWith(ANALYTICS_EVENTS.FINANCIAL_AUDIT_ACTION_TAPPED, {
      action_title: 'Freeze food delivery for 7 days',
      action_index: 0,
      score: 42,
    });
  });

  it('renders raw financial audit payload keys from the API/tool result', () => {
    const card: InsightCard = {
      type: 'financial_audit',
      title: 'Miriam Audit',
      sentiment: 'neutral',
      data: {
        score: { total: 68, status: 'stable' },
        period: { label: 'Last 6 months' },
        data_coverage: { months_analyzed: 6 },
        snapshot: {
          money_in: '5000.00',
          digital_money_out: '3200.00',
          receipt_cash_out: '400.00',
          total_money_out: '3600.00',
        },
        the_damage: { primary_issue: 'Subscriptions and transfers are doing the most damage.' },
        the_pattern: ['Money is leaving faster on weekends.'],
        top_spending_categories: [{ category: 'subscriptions', total: '600.00' }],
        do_this_today: [{ title: 'Cancel two unused subscriptions' }],
      },
    };

    const { getByText } = render(<InsightCardView card={card} />);

    expect(getByText('Subscriptions and transfers are doing the most damage.')).toBeTruthy();
    expect(getByText('Money is leaving faster on weekends.')).toBeTruthy();
    expect(getByText('subscriptions')).toBeTruthy();
    expect(getByText('Cancel two unused subscriptions')).toBeTruthy();
  });
});
