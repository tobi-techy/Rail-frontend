import { withRetry } from '../../api/offlineQueue';

describe('withRetry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return result on first success', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    
    const result = await withRetry(fn);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');

    const promise = withRetry(fn, { maxRetries: 3, baseDelay: 100 });
    
    // Fast-forward timers
    await jest.runAllTimersAsync();
    
    const result = await promise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw after max retries', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fails'));

    const promise = withRetry(fn, { maxRetries: 2, baseDelay: 100 });
    
    await jest.runAllTimersAsync();
    
    await expect(promise).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });
});
