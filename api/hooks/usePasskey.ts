import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PasskeyCreateRequest } from 'react-native-passkey';
import type { FinishPasskeyRegistrationRequest } from '../types';
import { queryKeys } from '../queryClient';
import { passkeyService } from '../services';
import { createNativePasskey } from '@/utils/passkeyNative';

type WebAuthnCreationOptions = { publicKey?: Record<string, any>; [key: string]: any };

const normalizePasskeyCreateRequest = (options: WebAuthnCreationOptions): PasskeyCreateRequest => {
  const pk = (options?.publicKey ?? options) as Record<string, any>;

  if (!pk?.challenge || !pk?.rp || !pk?.user || !pk?.pubKeyCredParams) {
    throw new Error('Invalid passkey creation options from server');
  }

  return {
    challenge: pk.challenge,
    rp: { id: pk.rp.id, name: pk.rp.name },
    user: {
      id: pk.user.id,
      name: pk.user.name,
      displayName: pk.user.displayName,
    },
    pubKeyCredParams: pk.pubKeyCredParams,
    timeout: pk.timeout,
    excludeCredentials: pk.excludeCredentials,
    authenticatorSelection: pk.authenticatorSelection,
    attestation: pk.attestation,
    extensions: pk.extensions,
  };
};

export function usePasskeys() {
  return useQuery({
    queryKey: queryKeys.passkeys.list(),
    queryFn: () => passkeyService.list(),
    select: (data) => data.credentials,
  });
}

export function useRegisterPasskey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name?: string) => {
      const { options, sessionId } = await passkeyService.beginRegistration();
      const createRequest = normalizePasskeyCreateRequest(options);
      const registrationResponse = await createNativePasskey(createRequest);
      const normalizedRegistrationResponse = {
        ...registrationResponse,
        type: registrationResponse?.type || 'public-key',
        clientExtensionResults: registrationResponse?.clientExtensionResults || {},
      };

      const payload: FinishPasskeyRegistrationRequest = {
        sessionId,
        response: normalizedRegistrationResponse,
        name,
      };

      return passkeyService.finishRegistration(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.passkeys.list() });
    },
  });
}

export function useDeletePasskey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => passkeyService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.passkeys.list() });
    },
  });
}
