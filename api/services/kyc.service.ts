import apiClient from '../client';
import type { BridgeKYCLinkResponse, KYCStatusResponse } from '../types';

const KYC_ENDPOINTS = {
  BRIDGE_LINK: '/v1/kyc/bridge/link',
  STATUS: '/v1/kyc/status',
};

export const kycService = {
  async getBridgeKYCLink(): Promise<BridgeKYCLinkResponse> {
    return apiClient.get<BridgeKYCLinkResponse>(KYC_ENDPOINTS.BRIDGE_LINK);
  },

  async getKYCStatus(): Promise<KYCStatusResponse> {
    return apiClient.get<KYCStatusResponse>(KYC_ENDPOINTS.STATUS);
  },
};

export default kycService;
