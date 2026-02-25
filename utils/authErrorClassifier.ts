type ErrorWithResponse = {
  status?: number;
  code?: string;
  message?: string;
  error?: {
    code?: string;
    message?: string;
  };
  response?: {
    status?: number;
    data?: {
      code?: string;
      error?: {
        code?: string;
      };
    };
  };
};

const AUTH_ERROR_CODES = new Set([
  'AUTH_ERROR',
  'FORBIDDEN',
  'HTTP_401',
  'HTTP_403',
  'INVALID_REFRESH_TOKEN',
  'INVALID_TOKEN',
  'SESSION_EXPIRED',
  'TOKEN_EXPIRED',
  'UNAUTHORIZED',
]);

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

export const getAuthErrorStatus = (error: unknown): number | null => {
  const err = error as ErrorWithResponse | null;
  return (
    toFiniteNumber(err?.status) ??
    toFiniteNumber(err?.response?.status) ??
    toFiniteNumber((err as any)?.error?.status) ??
    null
  );
};

export const getAuthErrorCode = (error: unknown): string | null => {
  const err = error as ErrorWithResponse | null;
  const rawCode =
    err?.code ?? err?.error?.code ?? err?.response?.data?.code ?? err?.response?.data?.error?.code;

  if (!rawCode || typeof rawCode !== 'string') {
    return null;
  }

  return rawCode.toUpperCase();
};

export const isAuthSessionInvalidError = (error: unknown): boolean => {
  const status = getAuthErrorStatus(error);
  if (status === 401 || status === 403 || status === 419) {
    return true;
  }

  const code = getAuthErrorCode(error);
  if (!code) {
    return false;
  }

  return AUTH_ERROR_CODES.has(code);
};
