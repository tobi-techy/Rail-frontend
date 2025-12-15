describe('env utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should use default API URL in development', () => {
    process.env.EXPO_PUBLIC_API_URL = undefined;
    // In dev mode, should fallback to localhost
    const { env } = require('../../utils/env');
    expect(env.EXPO_PUBLIC_API_URL).toBe('http://localhost:3000');
  });

  it('should use provided API URL when set', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';
    jest.resetModules();
    const { env } = require('../../utils/env');
    expect(env.EXPO_PUBLIC_API_URL).toBe('https://api.example.com');
  });

  it('should default to development environment', () => {
    process.env.EXPO_PUBLIC_ENV = undefined;
    jest.resetModules();
    const { env, isDev } = require('../../utils/env');
    expect(env.EXPO_PUBLIC_ENV).toBe('development');
    expect(isDev).toBe(true);
  });
});
