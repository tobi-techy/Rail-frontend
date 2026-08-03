export interface PostalCodeValidationResult {
  isValid: boolean;
  message?: string;
}

interface PostalCodeRule {
  pattern: RegExp;
  example: string;
  message: string;
  numericOnly?: boolean;
  maxLength?: number;
}

const ALPHA3_TO_ALPHA2: Record<string, string> = {
  ARE: 'AE',
  ARG: 'AR',
  AUS: 'AU',
  AUT: 'AT',
  BEL: 'BE',
  BGR: 'BG',
  BRA: 'BR',
  CAN: 'CA',
  CHE: 'CH',
  CHL: 'CL',
  CHN: 'CN',
  COL: 'CO',
  CZE: 'CZ',
  DEU: 'DE',
  DNK: 'DK',
  EGY: 'EG',
  ESP: 'ES',
  EST: 'EE',
  FIN: 'FI',
  FRA: 'FR',
  GBR: 'GB',
  GRC: 'GR',
  HRV: 'HR',
  HUN: 'HU',
  IND: 'IN',
  IRL: 'IE',
  ISR: 'IL',
  ITA: 'IT',
  JPN: 'JP',
  KEN: 'KE',
  KOR: 'KR',
  LUX: 'LU',
  LVA: 'LV',
  MEX: 'MX',
  MAR: 'MA',
  MYS: 'MY',
  NGA: 'NG',
  NLD: 'NL',
  NOR: 'NO',
  NZL: 'NZ',
  PER: 'PE',
  PHL: 'PH',
  POL: 'PL',
  PRT: 'PT',
  ROU: 'RO',
  RUS: 'RU',
  SAU: 'SA',
  SGP: 'SG',
  SVK: 'SK',
  SVN: 'SI',
  SWE: 'SE',
  THA: 'TH',
  TUR: 'TR',
  TWN: 'TW',
  UKR: 'UA',
  URY: 'UY',
  USA: 'US',
  VNM: 'VN',
  ZAF: 'ZA',
};

const POSTAL_CODE_RULES: Record<string, PostalCodeRule> = {
  AR: {
    pattern: /^[A-Z]?\d{4}[A-Z]{0,3}$/i,
    example: 'C1234ABC',
    message: 'Enter a valid Argentina postal code, e.g. C1234ABC.',
  },
  AT: {
    pattern: /^\d{4}$/,
    example: '1010',
    message: 'Enter a 4-digit Austrian postal code.',
    numericOnly: true,
    maxLength: 4,
  },
  AU: {
    pattern: /^\d{4}$/,
    example: '2000',
    message: 'Enter a 4-digit Australian postal code.',
    numericOnly: true,
    maxLength: 4,
  },
  BE: {
    pattern: /^\d{4}$/,
    example: '1000',
    message: 'Enter a 4-digit Belgian postal code.',
    numericOnly: true,
    maxLength: 4,
  },
  BR: {
    pattern: /^\d{5}-?\d{3}$/,
    example: '01001-000',
    message: 'Enter a valid Brazil postal code, e.g. 01001-000.',
  },
  CA: {
    pattern: /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i,
    example: 'K1A 0B1',
    message: 'Enter a valid Canadian postal code, e.g. K1A 0B1.',
  },
  CH: {
    pattern: /^\d{4}$/,
    example: '3000',
    message: 'Enter a 4-digit Swiss postal code.',
    numericOnly: true,
    maxLength: 4,
  },
  CL: {
    pattern: /^\d{7}$/,
    example: '8320000',
    message: 'Enter a 7-digit Chilean postal code.',
    numericOnly: true,
    maxLength: 7,
  },
  CN: {
    pattern: /^\d{6}$/,
    example: '100000',
    message: 'Enter a 6-digit Chinese postal code.',
    numericOnly: true,
    maxLength: 6,
  },
  CO: {
    pattern: /^\d{6}$/,
    example: '110111',
    message: 'Enter a 6-digit Colombian postal code.',
    numericOnly: true,
    maxLength: 6,
  },
  CZ: {
    pattern: /^\d{3}\s?\d{2}$/,
    example: '110 00',
    message: 'Enter a valid Czech postal code, e.g. 110 00.',
  },
  DE: {
    pattern: /^\d{5}$/,
    example: '10115',
    message: 'Enter a 5-digit German postal code.',
    numericOnly: true,
    maxLength: 5,
  },
  DK: {
    pattern: /^\d{4}$/,
    example: '1050',
    message: 'Enter a 4-digit Danish postal code.',
    numericOnly: true,
    maxLength: 4,
  },
  EE: {
    pattern: /^\d{5}$/,
    example: '10111',
    message: 'Enter a 5-digit Estonian postal code.',
    numericOnly: true,
    maxLength: 5,
  },
  EG: {
    pattern: /^(\d{5}|\d{7})$/,
    example: '11511',
    message: 'Enter a 5- or 7-digit Egyptian postal code.',
    numericOnly: true,
    maxLength: 7,
  },
  ES: {
    pattern: /^\d{5}$/,
    example: '28001',
    message: 'Enter a 5-digit Spanish postal code.',
    numericOnly: true,
    maxLength: 5,
  },
  FI: {
    pattern: /^\d{5}$/,
    example: '00100',
    message: 'Enter a 5-digit Finnish postal code.',
    numericOnly: true,
    maxLength: 5,
  },
  FR: {
    pattern: /^\d{5}$/,
    example: '75001',
    message: 'Enter a 5-digit French postal code.',
    numericOnly: true,
    maxLength: 5,
  },
  GB: {
    pattern: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
    example: 'SW1A 1AA',
    message: 'Enter a valid UK postcode, e.g. SW1A 1AA.',
  },
  GR: {
    pattern: /^\d{3}\s?\d{2}$/,
    example: '105 57',
    message: 'Enter a valid Greek postal code, e.g. 105 57.',
  },
  HR: {
    pattern: /^\d{5}$/,
    example: '10000',
    message: 'Enter a 5-digit Croatian postal code.',
    numericOnly: true,
    maxLength: 5,
  },
  HU: {
    pattern: /^\d{4}$/,
    example: '1011',
    message: 'Enter a 4-digit Hungarian postal code.',
    numericOnly: true,
    maxLength: 4,
  },
  IE: {
    pattern: /^[A-Z0-9]{3}\s?[A-Z0-9]{4}$/i,
    example: 'D02 AF30',
    message: 'Enter a valid Eircode, e.g. D02 AF30.',
  },
  IL: {
    pattern: /^(\d{5}|\d{7})$/,
    example: '6100000',
    message: 'Enter a 5- or 7-digit Israeli postal code.',
    numericOnly: true,
    maxLength: 7,
  },
  IN: {
    pattern: /^\d{6}$/,
    example: '110001',
    message: 'Enter a 6-digit Indian PIN code.',
    numericOnly: true,
    maxLength: 6,
  },
  IT: {
    pattern: /^\d{5}$/,
    example: '00100',
    message: 'Enter a 5-digit Italian postal code.',
    numericOnly: true,
    maxLength: 5,
  },
  JP: {
    pattern: /^\d{3}-?\d{4}$/,
    example: '100-0001',
    message: 'Enter a valid Japanese postal code, e.g. 100-0001.',
  },
  KE: {
    pattern: /^\d{5}$/,
    example: '00100',
    message: 'Enter a 5-digit Kenyan postal code.',
    numericOnly: true,
    maxLength: 5,
  },
  KR: {
    pattern: /^\d{5}$/,
    example: '03051',
    message: 'Enter a 5-digit South Korean postal code.',
    numericOnly: true,
    maxLength: 5,
  },
  LT: {
    pattern: /^\d{5}$/,
    example: '01001',
    message: 'Enter a 5-digit Lithuanian postal code.',
    numericOnly: true,
    maxLength: 5,
  },
  LU: {
    pattern: /^\d{4}$/,
    example: '1009',
    message: 'Enter a 4-digit Luxembourg postal code.',
    numericOnly: true,
    maxLength: 4,
  },
  LV: {
    pattern: /^(LV[- ]?)?\d{4}$/i,
    example: 'LV-1050',
    message: 'Enter a valid Latvian postal code, e.g. LV-1050.',
  },
  MA: {
    pattern: /^\d{5}$/,
    example: '20000',
    message: 'Enter a 5-digit Moroccan postal code.',
    numericOnly: true,
    maxLength: 5,
  },
  MX: {
    pattern: /^\d{5}$/,
    example: '06600',
    message: 'Enter a 5-digit Mexican postal code.',
    numericOnly: true,
    maxLength: 5,
  },
  MY: {
    pattern: /^\d{5}$/,
    example: '50000',
    message: 'Enter a 5-digit Malaysian postal code.',
    numericOnly: true,
    maxLength: 5,
  },
  NG: {
    pattern: /^\d{6}$/,
    example: '100001',
    message: 'Enter a 6-digit Nigerian postal code, e.g. 100001.',
    numericOnly: true,
    maxLength: 6,
  },
  NL: {
    pattern: /^\d{4}\s?[A-Z]{2}$/i,
    example: '1011 AB',
    message: 'Enter a valid Dutch postal code, e.g. 1011 AB.',
  },
  NO: {
    pattern: /^\d{4}$/,
    example: '0101',
    message: 'Enter a 4-digit Norwegian postal code.',
    numericOnly: true,
    maxLength: 4,
  },
  NZ: {
    pattern: /^\d{4}$/,
    example: '6011',
    message: 'Enter a 4-digit New Zealand postal code.',
    numericOnly: true,
    maxLength: 4,
  },
  PE: {
    pattern: /^(LIMA\s?\d{1,2}|CALLAO\s?\d{1,2}|\d{5})$/i,
    example: '15001',
    message: 'Enter a valid Peru postal code, e.g. 15001.',
  },
  PH: {
    pattern: /^\d{4}$/,
    example: '1000',
    message: 'Enter a 4-digit Philippine postal code.',
    numericOnly: true,
    maxLength: 4,
  },
  PL: {
    pattern: /^\d{2}-\d{3}$/,
    example: '00-001',
    message: 'Enter a valid Polish postal code, e.g. 00-001.',
  },
  PT: {
    pattern: /^\d{4}-\d{3}$/,
    example: '1000-001',
    message: 'Enter a valid Portuguese postal code, e.g. 1000-001.',
  },
  RO: {
    pattern: /^\d{6}$/,
    example: '010011',
    message: 'Enter a 6-digit Romanian postal code.',
    numericOnly: true,
    maxLength: 6,
  },
  RU: {
    pattern: /^\d{6}$/,
    example: '101000',
    message: 'Enter a 6-digit Russian postal code.',
    numericOnly: true,
    maxLength: 6,
  },
  SA: {
    pattern: /^\d{5}$/,
    example: '11564',
    message: 'Enter a 5-digit Saudi postal code.',
    numericOnly: true,
    maxLength: 5,
  },
  SE: {
    pattern: /^\d{3}\s?\d{2}$/,
    example: '111 22',
    message: 'Enter a valid Swedish postal code, e.g. 111 22.',
  },
  SG: {
    pattern: /^\d{6}$/,
    example: '018956',
    message: 'Enter a 6-digit Singapore postal code.',
    numericOnly: true,
    maxLength: 6,
  },
  SI: {
    pattern: /^\d{4}$/,
    example: '1000',
    message: 'Enter a 4-digit Slovenian postal code.',
    numericOnly: true,
    maxLength: 4,
  },
  SK: {
    pattern: /^\d{3}\s?\d{2}$/,
    example: '811 01',
    message: 'Enter a valid Slovak postal code, e.g. 811 01.',
  },
  TH: {
    pattern: /^\d{5}$/,
    example: '10200',
    message: 'Enter a 5-digit Thai postal code.',
    numericOnly: true,
    maxLength: 5,
  },
  TR: {
    pattern: /^\d{5}$/,
    example: '06100',
    message: 'Enter a 5-digit Turkish postal code.',
    numericOnly: true,
    maxLength: 5,
  },
  TW: {
    pattern: /^\d{3,6}$/,
    example: '10048',
    message: 'Enter a 3- to 6-digit Taiwan postal code.',
    numericOnly: true,
    maxLength: 6,
  },
  UA: {
    pattern: /^\d{5}$/,
    example: '01001',
    message: 'Enter a 5-digit Ukrainian postal code.',
    numericOnly: true,
    maxLength: 5,
  },
  US: {
    pattern: /^\d{5}([ -]?\d{4})?$/,
    example: '94103',
    message: 'Enter a valid US ZIP code, e.g. 94103 or 94103-0000.',
  },
  UY: {
    pattern: /^\d{5}$/,
    example: '11000',
    message: 'Enter a 5-digit Uruguay postal code.',
    numericOnly: true,
    maxLength: 5,
  },
  VN: {
    pattern: /^\d{5,6}$/,
    example: '10000',
    message: 'Enter a 5- or 6-digit Vietnam postal code.',
    numericOnly: true,
    maxLength: 6,
  },
  ZA: {
    pattern: /^\d{4}$/,
    example: '2001',
    message: 'Enter a 4-digit South African postal code.',
    numericOnly: true,
    maxLength: 4,
  },
};

export function normalizePostalCountryCode(countryCode: string | undefined): string {
  const normalized = countryCode?.trim().toUpperCase() ?? '';
  if (normalized.length === 3) {
    return ALPHA3_TO_ALPHA2[normalized] ?? normalized;
  }
  return normalized;
}

export function getPostalCodeRule(countryCode: string | undefined): PostalCodeRule | undefined {
  return POSTAL_CODE_RULES[normalizePostalCountryCode(countryCode)];
}

export function getPostalCodeHint(countryCode: string | undefined): string {
  const rule = getPostalCodeRule(countryCode);
  if (!rule) return 'Use the postal code for your residential address.';
  return `Example: ${rule.example}`;
}

export function getPostalCodeKeyboardType(
  countryCode: string | undefined
): 'number-pad' | 'default' {
  return getPostalCodeRule(countryCode)?.numericOnly ? 'number-pad' : 'default';
}

export function formatPostalCodeInput(value: string, countryCode: string | undefined): string {
  const rule = getPostalCodeRule(countryCode);
  if (!rule?.numericOnly) return value;

  const digits = value.replace(/\D/g, '');
  return typeof rule.maxLength === 'number' ? digits.slice(0, rule.maxLength) : digits;
}

export function validatePostalCodeForCountry(
  postalCode: string,
  countryCode: string | undefined
): PostalCodeValidationResult {
  const trimmed = postalCode.trim();
  if (!trimmed) {
    return { isValid: false, message: 'Postal code is required' };
  }

  const rule = getPostalCodeRule(countryCode);
  if (!rule) return { isValid: true };

  if (!rule.pattern.test(trimmed)) {
    return { isValid: false, message: rule.message };
  }

  return { isValid: true };
}
