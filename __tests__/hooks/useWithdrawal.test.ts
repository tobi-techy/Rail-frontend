import { renderHook, act } from '@testing-library/react-native';
import { useWithdrawal } from '../../hooks/domain/useWithdrawal';
import { useWithdrawalStore } from '../../stores/withdrawalStore';

jest.mock('../../stores/withdrawalStore');

describe('useWithdrawal', () => {
  const mockStore = {
    amount: '',
    recipientAddress: '',
    selectedToken: null,
    transaction: null,
    errors: { amount: null, address: null },
    isLoading: false,
    step: 'input' as const,
    showConfirmModal: false,
    setAmount: jest.fn(),
    setRecipientAddress: jest.fn(),
    setSelectedToken: jest.fn(),
    handleNumberPress: jest.fn(),
    handleDeletePress: jest.fn(),
    prepareTransaction: jest.fn(),
    submitWithdrawal: jest.fn(),
    setShowConfirmModal: jest.fn(),
    setStep: jest.fn(),
    reset: jest.fn(),
    validateAmount: jest.fn(() => true),
    validateAddress: jest.fn(() => true),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useWithdrawalStore as jest.Mock).mockReturnValue(mockStore);
  });

  it('should return store state and actions', () => {
    const { result } = renderHook(() => useWithdrawal());

    expect(result.current.amount).toBe('');
    expect(result.current.recipientAddress).toBe('');
    expect(result.current.selectedToken).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should calculate isValid based on validations', () => {
    const { result } = renderHook(() => useWithdrawal());

    expect(result.current.isValid).toBe(true);
  });

  it('should return false for isValid when amount invalid', () => {
    mockStore.validateAmount = jest.fn(() => false);
    const { result } = renderHook(() => useWithdrawal());

    expect(result.current.isValid).toBe(false);
  });

  it('should return false for isValid when address invalid', () => {
    mockStore.validateAddress = jest.fn(() => false);
    const { result } = renderHook(() => useWithdrawal());

    expect(result.current.isValid).toBe(false);
  });

  it('should provide all store actions', () => {
    const { result } = renderHook(() => useWithdrawal());

    expect(result.current.setAmount).toBeDefined();
    expect(result.current.setRecipientAddress).toBeDefined();
    expect(result.current.setSelectedToken).toBeDefined();
    expect(result.current.handleNumberPress).toBeDefined();
    expect(result.current.handleDeletePress).toBeDefined();
    expect(result.current.prepareTransaction).toBeDefined();
    expect(result.current.submitWithdrawal).toBeDefined();
    expect(result.current.reset).toBeDefined();
  });

  it('should call store actions when invoked', () => {
    const { result } = renderHook(() => useWithdrawal());

    act(() => {
      result.current.setAmount('100');
    });

    expect(mockStore.setAmount).toHaveBeenCalledWith('100');
  });
});