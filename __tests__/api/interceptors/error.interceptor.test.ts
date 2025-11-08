import { AxiosError } from 'axios';
import { handleApiError } from '../../../api/interceptors/error.interceptor';
import { ApiError, AuthError } from '../../../lib/errors';

describe('error.interceptor', () => {
  describe('handleApiError', () => {
    it('should throw ApiError for network errors', () => {
      const error = new AxiosError('Network Error');
      error.response = undefined;

      expect(() => handleApiError(error)).toThrow(ApiError);
      expect(() => handleApiError(error)).toThrow('No internet connection');
    });

    it('should throw AuthError for 401 status', () => {
      const error = new AxiosError('Unauthorized');
      error.response = {
        status: 401,
        data: { message: 'Unauthorized' },
        statusText: 'Unauthorized',
        headers: {},
        config: {} as any,
      };

      expect(() => handleApiError(error)).toThrow(AuthError);
    });

    it('should throw ApiError with NOT_FOUND code for 404', () => {
      const error = new AxiosError('Not Found');
      error.response = {
        status: 404,
        data: { message: 'Resource not found' },
        statusText: 'Not Found',
        headers: {},
        config: {} as any,
      };

      try {
        handleApiError(error);
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).statusCode).toBe(404);
        expect((e as ApiError).code).toBe('NOT_FOUND');
      }
    });

    it('should throw ApiError for 5xx server errors', () => {
      const error = new AxiosError('Internal Server Error');
      error.response = {
        status: 500,
        data: {},
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as any,
      };

      try {
        handleApiError(error);
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).statusCode).toBe(500);
        expect((e as ApiError).code).toBe('SERVER_ERROR');
      }
    });

    it('should extract error message from response data', () => {
      const error = new AxiosError('Bad Request');
      error.response = {
        status: 400,
        data: { error: { message: 'Validation failed' } },
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
      };

      try {
        handleApiError(error);
      } catch (e) {
        expect((e as ApiError).message).toBe('Validation failed');
      }
    });

    it('should use default error message if none provided', () => {
      const error = new AxiosError('Unknown Error');
      error.response = {
        status: 500,
        data: {},
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as any,
      };

      try {
        handleApiError(error);
      } catch (e) {
        expect((e as ApiError).message).toBe('Server error. Please try again later.');
      }
    });
  });
});