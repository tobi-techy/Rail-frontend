declare module 'jail-monkey' {
  export function isJailBroken(): boolean;
  export function isDebuggedMode(): boolean;
  export function hookDetected(): boolean;
  export function isOnExternalStorage(): boolean;
  export function AdbEnabled(): boolean;
  export function trustFall(): boolean;
}
