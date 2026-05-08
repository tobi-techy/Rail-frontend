import { act, renderHook, waitFor } from '@testing-library/react-native';
import { aiService } from '@/api/services/ai.service';
import { useNudge } from '@/hooks/useNudge';

jest.mock('@/api/services/ai.service', () => ({
  aiService: {
    getEnhancedNudge: jest.fn(),
    getNudge: jest.fn(),
  },
}));

jest.mock('expo-haptics', () => ({
  NotificationFeedbackType: {
    Warning: 'warning',
  },
  notificationAsync: jest.fn(() => Promise.resolve()),
}));

const mockAIService = aiService as jest.Mocked<typeof aiService>;

describe('useNudge', () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('sends enhanced screen context for ambient Miriam nudges', async () => {
    mockAIService.getEnhancedNudge.mockResolvedValue({
      show: true,
      message: 'Double-check the address before this leaves Rail.',
      severity: 'warning',
      shake: false,
      expires_in: 8,
    });

    const { result } = renderHook(() =>
      useNudge('withdraw_destination_test', '125.00', 'USDC', {
        daysUntilPayday: 5,
        merchantHint: 'wallet withdrawal address',
        recentActions: ['enter_wallet_address'],
      })
    );

    await waitFor(() => {
      expect(result.current.nudge?.message).toBe(
        'Double-check the address before this leaves Rail.'
      );
    });

    expect(mockAIService.getEnhancedNudge).toHaveBeenCalledWith({
      screen: 'withdraw_destination_test',
      amount: '125.00',
      currency: 'USDC',
      time_of_day: expect.any(String),
      day_of_week: expect.any(Number),
      days_until_payday: 5,
      merchant_hint: 'wallet withdrawal address',
      recent_actions: ['enter_wallet_address'],
    });
    expect(mockAIService.getNudge).not.toHaveBeenCalled();
  });

  it('falls back to the basic nudge endpoint when enhanced nudges fail', async () => {
    mockAIService.getEnhancedNudge.mockRejectedValue(new Error('enhanced unavailable'));
    mockAIService.getNudge.mockResolvedValue({
      show: true,
      message: 'Keep enough in Spend for fees.',
      severity: 'info',
      shake: false,
    });

    const { result } = renderHook(() => useNudge('withdraw_confirm_test', '48.00', 'USD'));

    await waitFor(() => {
      expect(result.current.nudge?.message).toBe('Keep enough in Spend for fees.');
    });

    expect(mockAIService.getNudge).toHaveBeenCalledWith('withdraw_confirm_test', '48.00', 'USD');
  });

  it('debounces live nudge requests while an amount is changing', async () => {
    jest.useFakeTimers();
    mockAIService.getEnhancedNudge.mockResolvedValue({
      show: true,
      message: 'That amount is close to your limit.',
      severity: 'warning',
      shake: false,
      expires_in: 8,
    });

    const { result } = renderHook(() =>
      useNudge('withdraw_live_debounce_test', '450.00', 'USD', {
        debounceMs: 500,
        cooldownMs: 1,
        cooldownScope: 'screen',
      })
    );

    act(() => {
      jest.advanceTimersByTime(499);
    });
    expect(mockAIService.getEnhancedNudge).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.nudge?.message).toBe('That amount is close to your limit.');
    });
    expect(mockAIService.getEnhancedNudge).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });
});
