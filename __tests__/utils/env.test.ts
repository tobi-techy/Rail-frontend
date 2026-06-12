import { Platform } from 'react-native';

describe('env utility', () => {
  const originalEnv = process.env;
  const originalDev = __DEV__;

  const loadEnvModule = (isDevice: boolean) => {
    jest.resetModules();
    jest.doMock('expo-device', () => ({ isDevice }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('../../utils/env');
  };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.EXPO_PUBLIC_API_URL;
    delete process.env.EXPO_PUBLIC_ENV;
    delete process.env.EXPO_PUBLIC_STAGING_API_URL;
    (global as any).__DEV__ = true;
  });

  afterEach(() => {
    jest.dontMock('expo-device');
  });

  afterAll(() => {
    process.env = originalEnv;
    (global as any).__DEV__ = originalDev;
  });

  it('should use localhost API URL on simulator in development', () => {
    process.env.EXPO_PUBLIC_API_URL = undefined;
    const { env } = loadEnvModule(false);
    const expectedUrl =
      Platform.OS === 'android' ? 'http://10.0.2.2:8080/api' : 'http://localhost:8080/api';
    expect(env.EXPO_PUBLIC_API_URL).toBe(expectedUrl);
  });

  it('should force staging API URL on physical device in development', () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:8080/api';
    const { env } = loadEnvModule(true);
    expect(env.EXPO_PUBLIC_API_URL).toBe('https://api-staging.userail.money/api');
  });

  it('should default to development environment', () => {
    process.env.EXPO_PUBLIC_ENV = undefined;
    const { env, isDev } = loadEnvModule(false);
    expect(env.EXPO_PUBLIC_ENV).toBe('development');
    expect(isDev).toBe(true);
  });

  it('should use configured production-safe API URL in non-dev runtime', () => {
    (global as any).__DEV__ = false;
    process.env.EXPO_PUBLIC_ENV = 'staging';
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com/';
    const { env } = loadEnvModule(false);
    expect(env.EXPO_PUBLIC_API_URL).toBe('https://api.example.com');
    expect(env.EXPO_PUBLIC_ENV).toBe('production');
  });

  it('should force production API URL when release runtime receives staging config', () => {
    (global as any).__DEV__ = false;
    process.env.EXPO_PUBLIC_ENV = 'staging';
    process.env.EXPO_PUBLIC_API_URL = 'https://api-staging.userail.money/api';
    const { env, isProd } = loadEnvModule(true);
    expect(env.EXPO_PUBLIC_API_URL).toBe('https://api.userail.money/api');
    expect(env.EXPO_PUBLIC_ENV).toBe('production');
    expect(isProd).toBe(true);
  });

  it('should not allow localhost API URL on physical device in non-dev runtime', () => {
    (global as any).__DEV__ = false;
    process.env.EXPO_PUBLIC_ENV = 'staging';
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:8080/api';
    const { env } = loadEnvModule(true);
    expect(env.EXPO_PUBLIC_API_URL).toBe('https://api.userail.money/api');
    expect(env.EXPO_PUBLIC_ENV).toBe('production');
  });
});
