import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Fingerprint } from 'lucide-react-native';
import { Passkey } from 'react-native-passkey';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import { useVerifyPasscode } from '@/api/hooks';
import { authService } from '@/api/services';
import { useAuthStore } from '@/stores/authStore';
import { SessionManager } from '@/utils/sessionManager';
import { getNativePasskey } from '@/utils/passkeyNative';
import {
  beginPasskeyPrompt,
  canStartPasskeyPrompt,
  endPasskeyPrompt,
  markPasskeyPromptSuccess,
} from '@/utils/passkeyPromptGuard';

// ─── Passkey helpers (mirrors login-passcode.tsx) ────────────────────────────

type WebAuthnOptionsPayload = { publicKey?: Record<string, any>; [key: string]: any };

const normalizePasskeyGetRequest = (options: WebAuthnOptionsPayload) => {
  const publicKey = (options?.publicKey ?? options) as Record<string, any>;
  if (!publicKey?.challenge || !publicKey?.rpId) throw new Error('Invalid passkey options');
  return {
    challenge: publicKey.challenge,
    rpId: publicKey.rpId,
    timeout: publicKey.timeout,
    allowCredentials: publicKey.allowCredentials,
    userVerification: publicKey.userVerification,
    extensions: publicKey.extensions,
  };
};

const isPasskeyCancelledError = (err: any) => {
  const code = String(err?.code || err?.error || '').toLowerCase();
  const msg = String(err?.message || '').toLowerCase();
  return (
    code.includes('usercancel') ||
    code.includes('cancel') ||
    code.includes('abort') ||
    msg.includes('cancelled') ||
    msg.includes('canceled')
  );
};

export default function AuthorizeTransactionScreen() {
  const params = useLocalSearchParams();
  const rawAmount = typeof params.amount === 'string' ? params.amount : '';
  const rawType = typeof params.type === 'string' ? params.type : '';
  const rawRecipient = typeof params.recipient === 'string' ? params.recipient : '';

  // Sanitize URL params — strip anything that isn't alphanumeric/basic punctuation
  const amount = rawAmount.replace(/[^0-9.]/g, '').slice(0, 20);
  const type = rawType.replace(/[^a-zA-Z]/g, '').slice(0, 30);
  const recipient = rawRecipient.replace(/[^a-zA-Z0-9@._\-]/g, '').slice(0, 100);

  const user = useAuthStore((s) => s.user);
  const isBiometricEnabled = useAuthStore((s) => s.isBiometricEnabled);

  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const passkeyPromptScope = `authorize-transaction:${user?.id ?? user?.email ?? 'unknown'}`;

  const { mutate: verifyPasscode, isPending: isLoading } = useVerifyPasscode();

  // Check passkey support once on mount
  useEffect(() => {
    if (Passkey.isSupported() && user?.email) setPasskeyAvailable(true);
  }, [user?.email]);

  const handlePasskeyAuth = useCallback(async () => {
    if (isPasskeyLoading || isLoading || !user?.email) return;

    if (!canStartPasskeyPrompt(passkeyPromptScope, 'manual')) return;
    if (!beginPasskeyPrompt()) return;

    setError('');
    setIsPasskeyLoading(true);

    try {
      const beginResponse = await authService.beginPasskeyLogin({ email: user.email });
      const passkeyRequest = normalizePasskeyGetRequest(beginResponse.options);
      const assertion = await getNativePasskey(passkeyRequest);

      const finishResponse = await authService.finishPasskeyLogin({
        sessionId: beginResponse.sessionId,
        response: { ...assertion, type: assertion.type || 'public-key' },
      });

      const nowIso = new Date().toISOString();
      const passcodeSessionToken = String(finishResponse.passcodeSessionToken || '').trim();
      if (!passcodeSessionToken) {
        throw new Error('Passkey verified but authorization session was not created');
      }
      const passcodeSessionExpiresAt = finishResponse.passcodeSessionExpiresAt
        ? new Date(finishResponse.passcodeSessionExpiresAt).toISOString()
        : new Date(Date.now() + 10 * 60 * 1000).toISOString();
      useAuthStore.setState({
        lastActivityAt: nowIso,
        passcodeSessionToken,
        passcodeSessionExpiresAt,
        csrfToken: finishResponse.csrfToken || useAuthStore.getState().csrfToken,
      });
      SessionManager.schedulePasscodeSessionExpiry(passcodeSessionExpiresAt);
      markPasskeyPromptSuccess(passkeyPromptScope);

      // Passkey verified — proceed
      router.back();
    } catch (err: any) {
      if (isPasskeyCancelledError(err)) {
        setError('Passkey cancelled. Enter your PIN to continue.');
        return;
      }
      setError('Passkey failed. Enter your PIN to continue.');
    } finally {
      endPasskeyPrompt();
      setIsPasskeyLoading(false);
    }
  }, [isPasskeyLoading, isLoading, passkeyPromptScope, user?.email]);

  const handlePasscodeSubmit = useCallback(
    (code: string) => {
      if (isLoading || isPasskeyLoading) return;
      setError('');

      verifyPasscode(
        { passcode: code },
        {
          onSuccess: (result) => {
            if (result.verified) {
              router.back();
            } else {
              setError('Invalid PIN. Please try again.');
              setPasscode('');
            }
          },
          onError: (err: any) => {
            setError(err?.message || 'Failed to verify PIN. Please try again.');
            setPasscode('');
          },
        }
      );
    },
    [verifyPasscode, isLoading, isPasskeyLoading]
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <View className="flex-1">
        {/* Back */}
        <View className="mt-2 px-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6]"
            activeOpacity={0.7}>
            <ArrowLeft size={24} color="#070914" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View className="mt-12 px-6">
          <Text className="font-heading text-[36px] leading-[42px] text-[#070914]">
            Authorize{'\n'}transaction
          </Text>
          {amount ? (
            <Text className="mt-2 font-body text-base text-[#6B7280]">
              Confirm {type ? String(type).toLowerCase() : 'transaction'}
              {amount ? ` of $${amount}` : ''}
              {recipient ? ` to ${recipient}` : ''}
            </Text>
          ) : null}
        </View>

        {/* Passkey button — shown when available and not auto-triggering */}
        {passkeyAvailable && (
          <View className="mt-8 px-6">
            <TouchableOpacity
              onPress={handlePasskeyAuth}
              disabled={isPasskeyLoading || isLoading}
              className="flex-row items-center justify-center gap-3 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] py-4"
              activeOpacity={0.7}>
              {isPasskeyLoading ? (
                <ActivityIndicator size="small" color="#070914" />
              ) : (
                <Fingerprint size={22} color="#070914" />
              )}
              <Text className="font-subtitle text-base text-[#070914]">
                {isPasskeyLoading ? 'Verifying…' : 'Use Passkey'}
              </Text>
            </TouchableOpacity>

            <View className="my-6 flex-row items-center gap-3">
              <View className="h-px flex-1 bg-[#E5E7EB]" />
              <Text className="font-caption text-sm text-[#9CA3AF]">or enter PIN</Text>
              <View className="h-px flex-1 bg-[#E5E7EB]" />
            </View>
          </View>
        )}

        {/* Passkey auto-loading overlay */}
        {isPasskeyLoading && isBiometricEnabled && (
          <View className="mt-10 items-center px-6">
            <ActivityIndicator size="large" color="#070914" />
            <Text className="mt-3 font-body text-base text-[#6B7280]">Verifying with passkey…</Text>
          </View>
        )}

        {/* PIN input */}
        <PasscodeInput
          subtitle="Enter your account PIN"
          length={4}
          value={passcode}
          onValueChange={(value) => {
            setPasscode(value);
            if (error) setError('');
          }}
          onComplete={handlePasscodeSubmit}
          errorText={error}
          showToggle
          autoSubmit
          className="mt-10 flex-1"
        />

        {/* Forgot PIN */}
        <View className="mb-8 items-center px-6">
          <TouchableOpacity activeOpacity={0.7}>
            <Text className="font-body-semibold text-[16px] text-[#3B82F6]">Forgot PIN?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
