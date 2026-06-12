import apiClient from '../client';
import type {
  AddWhitelistRequest,
  WhitelistedAddress,
  WhitelistResponse,
  MFAChallengeRequest,
  MFAChallengeResponse,
  MFAVerifyRequest,
  MFAVerifyResponse,
} from '../types/security';

const ENDPOINTS = {
  WHITELIST: '/v1/security/whitelist',
  WHITELIST_ITEM: (id: string) => `/v1/security/whitelist/${id}`,
  MFA_CHALLENGE: '/v1/security/mfa/challenge',
  MFA_VERIFY: '/v1/security/mfa/verify-challenge',
} as const;

export const securityService = {
  // Whitelist
  getWhitelist: () => apiClient.get<WhitelistResponse>(ENDPOINTS.WHITELIST),

  addWhitelistAddress: (req: AddWhitelistRequest) =>
    apiClient.post<{ address: WhitelistedAddress }>(ENDPOINTS.WHITELIST, req),

  removeWhitelistAddress: (id: string) =>
    apiClient.delete<{ message: string }>(ENDPOINTS.WHITELIST_ITEM(id)),

  // MFA
  requestMFAChallenge: (req: MFAChallengeRequest) =>
    apiClient.post<MFAChallengeResponse>(ENDPOINTS.MFA_CHALLENGE, req),

  verifyMFAChallenge: (req: MFAVerifyRequest) =>
    apiClient.post<MFAVerifyResponse>(ENDPOINTS.MFA_VERIFY, req),
};
