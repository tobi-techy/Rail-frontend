import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FinishPasskeyRegistrationRequest } from '../types';

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

      const publicKey = options.publicKey ?? options;
      const registrationResponse = await Passkey.create(publicKey);

      const payload: FinishPasskeyRegistrationRequest = {
        sessionId,
        response: registrationResponse,
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
