import { errorLogger } from '../../utils/errorLogger';

describe('errorLogger', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

  beforeEach(() => {
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it('should log error with context', () => {
    const error = new Error('Test error');
    errorLogger.logError(error, {
      component: 'TestComponent',
      action: 'testAction',
    });

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should log API errors', () => {
    const error = new Error('API failed');
    errorLogger.logApiError(error, '/api/test', 'GET');

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should log auth errors', () => {
    const error = new Error('Auth failed');
    errorLogger.logAuthError(error, 'login');

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle non-Error objects', () => {
    errorLogger.logError('string error', {
      component: 'Test',
      action: 'test',
    });

    expect(consoleSpy).toHaveBeenCalled();
  });
});
