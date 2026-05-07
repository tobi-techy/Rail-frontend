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
});
