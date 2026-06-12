import apiClient from '../client';
import type {
  ListPasskeysResponse,
  BeginPasskeyRegistrationResponse,
  FinishPasskeyRegistrationRequest,
  FinishPasskeyRegistrationResponse,
  DeletePasskeyResponse,
} from '../types';

const ENDPOINTS = {
  LIST: '/v1/security/passkeys',
  REGISTER_BEGIN: '/v1/security/passkeys/register',
  REGISTER_FINISH: '/v1/security/passkeys/register/finish',
  DELETE: (id: string) => `/v1/security/passkeys/${id}`,
};

export const passkeyService = {
  list: (): Promise<ListPasskeysResponse> => apiClient.get(ENDPOINTS.LIST),

  beginRegistration: (): Promise<BeginPasskeyRegistrationResponse> =>
    apiClient.post(ENDPOINTS.REGISTER_BEGIN, {}),

  finishRegistration: (
    data: FinishPasskeyRegistrationRequest
  ): Promise<FinishPasskeyRegistrationResponse> => apiClient.post(ENDPOINTS.REGISTER_FINISH, data),

  delete: (id: string): Promise<DeletePasskeyResponse> => apiClient.delete(ENDPOINTS.DELETE(id)),
};

export default passkeyService;
