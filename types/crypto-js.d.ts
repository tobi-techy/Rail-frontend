declare module 'crypto-js' {
  export const AES: any;
  export const enc: any;
  export const algo: any;
  export function PBKDF2(
    password: string,
    salt: any,
    options?: { keySize?: number; iterations?: number; hasher?: any }
  ): any;
  export namespace lib {
    type WordArray = any;
  }
}
