import { useState, useEffect } from 'react';
import { useCreatePasscode, usePasscodeStatus, useUpdatePasscode } from '@/api/hooks';

const PIN_REGEX = /^\d{4}$/;
const PIN_MAX_LENGTH = 4;

export const sanitizePin = (v: string) => v.replace(/\D/g, '').slice(0, PIN_MAX_LENGTH);

interface UsePinChangeOptions {
  isSheetOpen: boolean;
  onSuccess: () => void;
}

export function usePinChange({ isSheetOpen, onSuccess }: UsePinChangeOptions) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);

  const { data: passcodeStatus, refetch: refetchPasscodeStatus } = usePasscodeStatus();
  const { mutateAsync: createPasscode, isPending: isCreatingPasscode } = useCreatePasscode();
  const { mutateAsync: updatePasscode, isPending: isUpdatingPasscode } = useUpdatePasscode();

  const hasPasscodeConfigured = passcodeStatus?.enabled ?? false;
  const isSavingPin = isCreatingPasscode || isUpdatingPasscode;

  useEffect(() => {
    if (!isSheetOpen) return;
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setPinError(null);
    setPinSuccess(null);
    void refetchPasscodeStatus();
  }, [isSheetOpen, refetchPasscodeStatus]);

  const handleSubmitPin = async () => {
    if (isSavingPin) return;
    setPinError(null);
    setPinSuccess(null);
    if (hasPasscodeConfigured && !PIN_REGEX.test(currentPin)) {
      setPinError('Current PIN must be exactly 4 digits.');
      return;
    }
    if (!PIN_REGEX.test(newPin)) {
      setPinError('New PIN must be exactly 4 digits.');
      return;
    }
    if (!PIN_REGEX.test(confirmPin)) {
      setPinError('Confirm PIN must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('New PIN and confirmation do not match.');
      return;
    }
    try {
      if (hasPasscodeConfigured) {
        await updatePasscode({
          currentPasscode: currentPin,
          newPasscode: newPin,
          confirmPasscode: confirmPin,
        });
      } else {
        await createPasscode({ passcode: newPin, confirmPasscode: confirmPin });
      }
      setPinSuccess(
        hasPasscodeConfigured ? 'PIN updated successfully.' : 'PIN created successfully.'
      );
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      await refetchPasscodeStatus();
      setTimeout(onSuccess, 500);
    } catch (error: any) {
      setPinError(
        error?.message ||
          (hasPasscodeConfigured ? 'Failed to update PIN.' : 'Failed to create PIN.')
      );
    }
  };

  return {
    currentPin,
    setCurrentPin: (v: string) => setCurrentPin(sanitizePin(v)),
    newPin,
    setNewPin: (v: string) => setNewPin(sanitizePin(v)),
    confirmPin,
    setConfirmPin: (v: string) => setConfirmPin(sanitizePin(v)),
    pinError,
    pinSuccess,
    hasPasscodeConfigured,
    isSavingPin,
    handleSubmitPin,
    PIN_MAX_LENGTH,
  };
}
