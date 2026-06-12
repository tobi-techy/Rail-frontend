/**
 * In-memory store for the route to return to after passcode unlock.
 * Not persisted — resets on app restart (cold start goes to tabs).
 */
let _returnRoute: string | null = null;

const EXCLUDED = new Set(['/login-passcode', '/intro', '/', '/index']);

export function setReturnRoute(pathname: string, params?: Record<string, string>) {
  if (EXCLUDED.has(pathname) || pathname.startsWith('/(auth)')) return;
  if (params && Object.keys(params).length > 0) {
    const search = new URLSearchParams(params).toString();
    _returnRoute = `${pathname}?${search}`;
  } else {
    _returnRoute = pathname;
  }
}

export function consumeReturnRoute(): string {
  const route = _returnRoute;
  _returnRoute = null;
  return route || '/(tabs)';
}
