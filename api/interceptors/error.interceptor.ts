import { AxiosError } from 'axios';
import { ApiError, AuthError } from '@/lib/errors';
import { ERROR_MESSAGES } from '@/lib/constants/messages';

export function handleApiError(error: AxiosError): never {
  if (!error.response) {
    throw new ApiError(ERROR_MESSAGES.NETWORK.NO_CONNECTION, 0, 'NETWORK_ERROR');
  }

  const { status, data } = error.response;
  const message = (data as any)?.error?.message || (data as any)?.message || ERROR_MESSAGES.NETWORK.SERVER_ERROR;

  if (status === 401) {
    throw new AuthError(message);
  }

  if (status === 404) {
    throw new ApiError(message, 404, 'NOT_FOUND');
  }

  if (status >= 500) {
    throw new ApiError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, status, 'SERVER_ERROR');
  }

  throw new ApiError(message, status);
}
