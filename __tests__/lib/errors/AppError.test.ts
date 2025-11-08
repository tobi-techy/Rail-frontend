import {
  AppError,
  ApiError,
  ValidationError,
  AuthError,
} from '../../../lib/errors/AppError';

describe('AppError classes', () => {
  describe('AppError', () => {
    it('should create error with message', () => {
      const error = new AppError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('AppError');
      expect(error instanceof Error).toBe(true);
    });

    it('should create error with code and status', () => {
      const error = new AppError('Test error', 'TEST_CODE', 400);
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('ApiError', () => {
    it('should create API error', () => {
      const error = new ApiError('API failed', 500);
      
      expect(error.message).toBe('API failed');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('ApiError');
      expect(error instanceof AppError).toBe(true);
    });

    it('should create API error with code', () => {
      const error = new ApiError('Not found', 404, 'NOT_FOUND');
      
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.message).toBe('Invalid input');
      expect(error.name).toBe('ValidationError');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
    });

    it('should create validation error with field', () => {
      const error = new ValidationError('Email is invalid', 'email');
      
      expect(error.field).toBe('email');
    });
  });

  describe('AuthError', () => {
    it('should create auth error', () => {
      const error = new AuthError('Unauthorized');
      
      expect(error.message).toBe('Unauthorized');
      expect(error.name).toBe('AuthError');
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('error inheritance', () => {
    it('should allow catching as AppError', () => {
      const errors = [
        new AppError('app error'),
        new ApiError('api error', 500),
        new ValidationError('validation error'),
        new AuthError('auth error'),
      ];

      errors.forEach(error => {
        expect(error instanceof AppError).toBe(true);
        expect(error instanceof Error).toBe(true);
      });
    });

    it('should have proper stack trace', () => {
      const error = new AppError('Test error');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });
});