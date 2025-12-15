import { renderHook, act } from '@testing-library/react-native';
import { useDebounce, useThrottle, usePrevious } from '../../hooks/useOptimized';

jest.useFakeTimers();

describe('useDebounce', () => {
  it('should debounce callback', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebounce(callback, 500));

    act(() => {
      result.current('arg1');
      result.current('arg2');
      result.current('arg3');
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('arg3');
  });
});

describe('useThrottle', () => {
  it('should throttle callback', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useThrottle(callback, 500));

    act(() => {
      result.current('arg1');
    });
    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      result.current('arg2');
    });
    expect(callback).toHaveBeenCalledTimes(1); // Still 1, throttled

    act(() => {
      jest.advanceTimersByTime(500);
      result.current('arg3');
    });
    expect(callback).toHaveBeenCalledTimes(2);
  });
});

describe('usePrevious', () => {
  it('should return previous value', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 1 },
    });

    expect(result.current).toBeUndefined();

    rerender({ value: 2 });
    expect(result.current).toBe(1);

    rerender({ value: 3 });
    expect(result.current).toBe(2);
  });
});
