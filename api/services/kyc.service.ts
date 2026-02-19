import apiClient from '../client';
import type {
  StartSumsubSessionRequest,
  StartSumsubSessionResponse,
  KYCStatusResponse,
  BridgeKYCLinkResponse,
} from '../types';

const KYC_ENDPOINTS = {
  SUMSUB_SESSION: '/v1/kyc/sumsub/session',
  STATUS: '/v1/kyc/status',
  BRIDGE_LINK: '/v1/kyc/bridge/link',
} as const;

export const kycService = {
  async startSumsubSession(data: StartSumsubSessionRequest): Promise<StartSumsubSessionResponse> {
    return apiClient.post<StartSumsubSessionResponse>(KYC_ENDPOINTS.SUMSUB_SESSION, data);
  },

  async getKYCStatus(): Promise<KYCStatusResponse> {
    return apiClient.get<KYCStatusResponse>(KYC_ENDPOINTS.STATUS);
  },

  // Legacy — kept for backward compat
  async getBridgeKYCLink(): Promise<BridgeKYCLinkResponse> {
    return apiClient.get<BridgeKYCLinkResponse>(KYC_ENDPOINTS.BRIDGE_LINK);
  },
};

export default kycService;
