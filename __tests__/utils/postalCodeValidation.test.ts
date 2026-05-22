import {
  formatPostalCodeInput,
  getPostalCodeKeyboardType,
  validatePostalCodeForCountry,
} from '@/utils/postalCodeValidation';

describe('postalCodeValidation', () => {
  it('requires Nigerian postal codes to be six digits', () => {
    expect(validatePostalCodeForCountry('100001', 'NG').isValid).toBe(true);
    expect(validatePostalCodeForCountry('100001', 'NGA').isValid).toBe(true);
    expect(validatePostalCodeForCountry('10001', 'NG')).toEqual({
      isValid: false,
      message: 'Enter a 6-digit Nigerian postal code, e.g. 100001.',
    });
  });

  it('keeps Nigerian postal code input numeric and capped at six digits', () => {
    expect(formatPostalCodeInput('abc10000199', 'NG')).toBe('100001');
    expect(getPostalCodeKeyboardType('NG')).toBe('number-pad');
  });

  it('validates common non-numeric postal formats without stripping input', () => {
    expect(validatePostalCodeForCountry('K1A 0B1', 'CA').isValid).toBe(true);
    expect(validatePostalCodeForCountry('SW1A 1AA', 'GB').isValid).toBe(true);
    expect(formatPostalCodeInput('SW1A 1AA', 'GB')).toBe('SW1A 1AA');
  });

  it('allows countries without a local frontend rule to pass format validation', () => {
    expect(validatePostalCodeForCountry('ABC-123', 'HK').isValid).toBe(true);
  });
});
