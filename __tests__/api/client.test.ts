import { API_CONFIG } from '../../api/config';

describe('API Config', () => {
  it('should have valid timeout', () => {
    expect(API_CONFIG.timeout).toBeGreaterThan(0);
  });

  it('should have retry configuration', () => {
    expect(API_CONFIG.retries).toBeGreaterThan(0);
    expect(API_CONFIG.retryDelay).toBeGreaterThan(0);
  });

  it('should have baseURL defined in dev', () => {
    expect(API_CONFIG.baseURL).toBeDefined();
    expect(typeof API_CONFIG.baseURL).toBe('string');
  });
});
