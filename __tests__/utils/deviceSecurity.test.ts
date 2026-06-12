import {
  checkDeviceSecurity,
  enforceDeviceSecurity,
  isDeviceCompromised,
} from '../../utils/deviceSecurity';
import JailMonkey from 'jail-monkey';

jest.mock('jail-monkey');

describe('deviceSecurity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkDeviceSecurity', () => {
    it('should return secure result when device is not compromised', async () => {
      (JailMonkey.isJailBroken as jest.Mock).mockReturnValue(false);
      (JailMonkey.isDebuggedMode as jest.Mock).mockReturnValue(false);
      (JailMonkey.hookDetected as jest.Mock).mockReturnValue(false);
      (JailMonkey.isOnExternalStorage as jest.Mock).mockReturnValue(false);

      const result = await checkDeviceSecurity();

      expect(result.isSecure).toBe(true);
      expect(result.isJailbroken).toBe(false);
      expect(result.isRooted).toBe(false);
      expect(result.isDebuggedMode).toBe(false);
      expect(result.hookDetected).toBe(false);
    });

    it('should detect jailbroken device', async () => {
      (JailMonkey.isJailBroken as jest.Mock).mockReturnValue(true);
      (JailMonkey.isDebuggedMode as jest.Mock).mockReturnValue(false);
      (JailMonkey.hookDetected as jest.Mock).mockReturnValue(false);

      const result = await checkDeviceSecurity();

      expect(result.isSecure).toBe(false);
      expect(result.isJailbroken).toBe(true);
    });

    it('should detect debug mode', async () => {
      (JailMonkey.isJailBroken as jest.Mock).mockReturnValue(false);
      (JailMonkey.isDebuggedMode as jest.Mock).mockReturnValue(true);
      (JailMonkey.hookDetected as jest.Mock).mockReturnValue(false);

      const result = await checkDeviceSecurity();

      expect(result.isSecure).toBe(false);
      expect(result.isDebuggedMode).toBe(true);
    });

    it('should detect hook tampering', async () => {
      (JailMonkey.isJailBroken as jest.Mock).mockReturnValue(false);
      (JailMonkey.isDebuggedMode as jest.Mock).mockReturnValue(false);
      (JailMonkey.hookDetected as jest.Mock).mockReturnValue(true);

      const result = await checkDeviceSecurity();

      expect(result.isSecure).toBe(false);
      expect(result.hookDetected).toBe(true);
    });

    it('should detect multiple security issues', async () => {
      (JailMonkey.isJailBroken as jest.Mock).mockReturnValue(true);
      (JailMonkey.isDebuggedMode as jest.Mock).mockReturnValue(true);
      (JailMonkey.hookDetected as jest.Mock).mockReturnValue(true);

      const result = await checkDeviceSecurity();

      expect(result.isSecure).toBe(false);
      expect(result.isJailbroken).toBe(true);
      expect(result.isDebuggedMode).toBe(true);
      expect(result.hookDetected).toBe(true);
    });
  });

  describe('isDeviceCompromised', () => {
    it('should return false in development mode', () => {
      const result = isDeviceCompromised();
      expect(result).toBe(false);
      expect(JailMonkey.isJailBroken).not.toHaveBeenCalled();
      expect(JailMonkey.hookDetected).not.toHaveBeenCalled();
    });
  });
});
