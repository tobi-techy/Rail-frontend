import {
  validateEmail,
  validatePassword,
  validateAmount,
  validateWalletAddress,
  validatePasscode,
  validatePhoneNumber,
  validateName,
} from '../../utils/validators';

describe('validators', () => {
  describe('validateEmail', () => {
    it('should validate correct emails', () => {
      expect(validateEmail('user@example.com').isValid).toBe(true);
      expect(validateEmail('test.user@example.co.uk').isValid).toBe(true);
      expect(validateEmail('user+tag@example.com').isValid).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('').isValid).toBe(false);
      expect(validateEmail('not-an-email').isValid).toBe(false);
      expect(validateEmail('@example.com').isValid).toBe(false);
      expect(validateEmail('user@').isValid).toBe(false);
      expect(validateEmail('user @example.com').isValid).toBe(false);
    });

    it('should return error messages', () => {
      expect(validateEmail('').error).toBe('Email is required');
      expect(validateEmail('invalid').error).toBe('Please enter a valid email address');
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('Password123').isValid).toBe(true);
      expect(validatePassword('Secure@Pass1').isValid).toBe(true);
    });

    it('should reject empty password', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password is required');
    });

    it('should reject short passwords', () => {
      const result = validatePassword('Pass1');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 8 characters');
    });

    it('should require uppercase letter', () => {
      const result = validatePassword('password123');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('uppercase letter');
    });

    it('should require lowercase letter', () => {
      const result = validatePassword('PASSWORD123');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('lowercase letter');
    });

    it('should require number', () => {
      const result = validatePassword('PasswordOnly');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('number');
    });
  });

  describe('validateAmount', () => {
    it('should validate positive amounts', () => {
      expect(validateAmount(10, 5).isValid).toBe(true);
      expect(validateAmount(100.50, 0).isValid).toBe(true);
      expect(validateAmount('50', 10).isValid).toBe(true);
    });

    it('should reject zero or negative amounts', () => {
      expect(validateAmount(0).isValid).toBe(false);
      expect(validateAmount(-5).isValid).toBe(false);
    });

    it('should check minimum amount', () => {
      const result = validateAmount(5, 10);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least');
    });

    it('should check maximum amount', () => {
      const result = validateAmount(200, 0, 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot exceed');
    });

    it('should handle string amounts', () => {
      expect(validateAmount('50.25', 10).isValid).toBe(true);
      expect(validateAmount('invalid', 10).isValid).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateAmount(10.0001, 10, 11).isValid).toBe(true);
      expect(validateAmount(10.00, 10, 11).isValid).toBe(true);
    });
  });

  describe('validateWalletAddress', () => {
    it('should validate Ethereum addresses', () => {
      const validEth = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      expect(validateWalletAddress(validEth, 'ethereum').isValid).toBe(true);
    });

    it('should validate Bitcoin addresses', () => {
      const validBtc = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
      expect(validateWalletAddress(validBtc, 'bitcoin').isValid).toBe(true);
      
      const validBtc2 = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
      expect(validateWalletAddress(validBtc2, 'bitcoin').isValid).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(validateWalletAddress('', 'ethereum').isValid).toBe(false);
      expect(validateWalletAddress('invalid', 'ethereum').isValid).toBe(false);
      expect(validateWalletAddress('0x123', 'ethereum').isValid).toBe(false);
    });

    it('should handle unsupported networks', () => {
      const result = validateWalletAddress('someaddress', 'unsupported' as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unsupported');
    });
  });

  describe('validatePasscode', () => {
    it('should validate 6-digit passcodes', () => {
      expect(validatePasscode('123456').isValid).toBe(true);
      expect(validatePasscode('000000').isValid).toBe(true);
      expect(validatePasscode('999999').isValid).toBe(true);
    });

    it('should reject non-6-digit passcodes', () => {
      expect(validatePasscode('').isValid).toBe(false);
      expect(validatePasscode('12345').isValid).toBe(false);
      expect(validatePasscode('1234567').isValid).toBe(false);
    });

    it('should reject non-numeric passcodes', () => {
      expect(validatePasscode('12345a').isValid).toBe(false);
      expect(validatePasscode('abcdef').isValid).toBe(false);
    });

    it('should reject weak passcodes', () => {
      expect(validatePasscode('123456').isValid).toBe(false);
      expect(validatePasscode('111111').isValid).toBe(false);
    });

    it('should return appropriate error messages', () => {
      expect(validatePasscode('').error).toBe('Passcode is required');
      expect(validatePasscode('123').error).toBe('Passcode must be exactly 6 digits');
      expect(validatePasscode('123456').error).toContain('too simple');
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate US phone numbers', () => {
      expect(validatePhoneNumber('+1234567890').isValid).toBe(true);
      expect(validatePhoneNumber('1234567890').isValid).toBe(true);
    });

    it('should validate international phone numbers', () => {
      expect(validatePhoneNumber('+442071234567').isValid).toBe(true);
      expect(validatePhoneNumber('+919876543210').isValid).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('').isValid).toBe(false);
      expect(validatePhoneNumber('123').isValid).toBe(false);
      expect(validatePhoneNumber('abcdefghij').isValid).toBe(false);
    });

    it('should handle various formats', () => {
      expect(validatePhoneNumber('(123) 456-7890').isValid).toBe(true);
      expect(validatePhoneNumber('123-456-7890').isValid).toBe(true);
    });
  });

  describe('validateName', () => {
    it('should validate normal names', () => {
      expect(validateName('John Doe').isValid).toBe(true);
      expect(validateName('Mary-Jane').isValid).toBe(true);
      expect(validateName("O'Brien").isValid).toBe(true);
    });

    it('should reject empty names', () => {
      const result = validateName('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Name is required');
    });

    it('should reject names that are too short', () => {
      const result = validateName('A');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 2 characters');
    });

    it('should reject names with invalid characters', () => {
      expect(validateName('John123').isValid).toBe(false);
      expect(validateName('John@Doe').isValid).toBe(false);
      expect(validateName('John<script>').isValid).toBe(false);
    });

    it('should trim whitespace', () => {
      expect(validateName('  John Doe  ').isValid).toBe(true);
    });
  });
});