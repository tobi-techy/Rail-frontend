import { errorLogger } from '../../utils/errorLogger';

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

describe('errorLogger', () => {
  let mockConsoleError: jest.Mock;
  let mockConsoleWarn: jest.Mock;

  beforeEach(() => {
    mockConsoleError = jest.fn();
    mockConsoleWarn = jest.fn();
    console.error = mockConsoleError;
    console.warn = mockConsoleWarn;
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  describe('logError', () => {
    it('should log Error objects', () => {
      const error = new Error('Test error');
      errorLogger.logError(error);
      
      expect(mockConsoleError).toHaveBeenCalled();
      const loggedData = mockConsoleError.mock.calls[0][1];
      expect(loggedData.message).toBe('Test error');
      expect(loggedData.stack).toBeDefined();
    });

    it('should log string errors', () => {
      errorLogger.logError('String error message');
      
      expect(mockConsoleError).toHaveBeenCalled();
      const loggedData = mockConsoleError.mock.calls[0][1];
      expect(loggedData.message).toBe('String error message');
    });

    it('should include context information', () => {
      const error = new Error('Test error');
      const context = {
        component: 'TestComponent',
        action: 'testAction',
        userId: 'user123',
      };
      
      errorLogger.logError(error, context);
      
      expect(mockConsoleError).toHaveBeenCalled();
      const loggedData = mockConsoleError.mock.calls[0][1];
      expect(loggedData.component).toBe('TestComponent');
      expect(loggedData.action).toBe('testAction');
    });

    it('should sanitize sensitive data in context', () => {
      const error = new Error('Test error');
      const context = {
        metadata: {
          password: 'secret123',
          token: 'abc123',
        },
      };
      
      errorLogger.logError(error, context);
      
      expect(mockConsoleError).toHaveBeenCalled();
      const loggedData = mockConsoleError.mock.calls[0][1];
      expect(loggedData.metadata.password).toBe('[REDACTED]');
      expect(loggedData.metadata.token).toBe('[REDACTED]');
    });
  });

  describe('logApiError', () => {
    it('should log API errors with endpoint info', () => {
      const error = {
        response: {
          status: 404,
          statusText: 'Not Found',
        },
      };
      
      errorLogger.logApiError(error, '/api/users', 'GET');
      
      expect(mockConsoleError).toHaveBeenCalled();
      const loggedData = mockConsoleError.mock.calls[0][1];
      expect(loggedData.component).toBe('API');
      expect(loggedData.action).toBe('GET /api/users');
      expect(loggedData.metadata.status).toBe(404);
    });

    it('should handle errors without response', () => {
      const error = new Error('Network error');
      
      errorLogger.logApiError(error, '/api/users', 'POST');
      
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('logWarning', () => {
    it('should log warnings', () => {
      errorLogger.logWarning('Test warning message');
      
      expect(mockConsoleWarn).toHaveBeenCalled();
    });

    it('should include context in warnings', () => {
      errorLogger.logWarning('Test warning', { component: 'TestComponent' });
      
      expect(mockConsoleWarn).toHaveBeenCalled();
      const loggedData = mockConsoleWarn.mock.calls[0][1];
      expect(loggedData.component).toBe('TestComponent');
    });
  });

  describe('sanitization', () => {
    it('should not log sensitive fields', () => {
      const error = new Error('Auth error');
      const context = {
        metadata: {
          accessToken: 'token123',
          refreshToken: 'refresh456',
          passcode: '123456',
          secret: 'secret789',
        },
      };
      
      errorLogger.logError(error, context);
      
      const logged = JSON.stringify(mockConsoleError.mock.calls[0]);
      expect(logged).not.toContain('token123');
      expect(logged).not.toContain('refresh456');
      expect(logged).not.toContain('123456');
      expect(logged).not.toContain('secret789');
      expect(logged).toContain('[REDACTED]');
    });
  });
});