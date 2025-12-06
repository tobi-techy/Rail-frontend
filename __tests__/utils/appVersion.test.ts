import { APP_VERSION, getFullVersion } from '../../utils/appVersion';

describe('appVersion', () => {
  it('should have APP_VERSION defined', () => {
    expect(APP_VERSION).toBeDefined();
    expect(typeof APP_VERSION).toBe('string');
  });

  it('should return full version string', () => {
    const fullVersion = getFullVersion();
    expect(fullVersion).toContain(APP_VERSION);
    expect(fullVersion).toMatch(/\d+\.\d+\.\d+ \(\d+\)/);
  });
});
