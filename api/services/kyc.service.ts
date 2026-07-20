import apiClient from '../client';
import type {
  StartDiditSessionRequest,
  StartDiditSessionResponse,
  KYCStatusResponse,
  KYCProviderStatus,
  BridgeKYCLinkResponse,
  SubmitKYCRequest,
  SubmitKYCResponse,
} from '../types';

const KYC_ENDPOINTS = {
  DIDIT_SESSION: '/v1/kyc/didit/session',
  SUBMIT: '/v1/kyc/submit',
  STATUS: '/v1/kyc/status',
  BRIDGE_LINK: '/v1/kyc/bridge/link',
  BRIDGE_STATUS: '/v1/kyc/bridge/status',
} as const;

export const kycService = {
  async startDiditSession(data: StartDiditSessionRequest): Promise<StartDiditSessionResponse> {
    return apiClient.post<StartDiditSessionResponse>(KYC_ENDPOINTS.DIDIT_SESSION, data);
  },

  async submitKYC(data: SubmitKYCRequest): Promise<SubmitKYCResponse> {
    return apiClient.post<SubmitKYCResponse>(KYC_ENDPOINTS.SUBMIT, data);
  },

  async getKYCStatus(): Promise<KYCStatusResponse> {
    return apiClient.get<KYCStatusResponse>(KYC_ENDPOINTS.STATUS);
  },

  // Tier 3 — Bridge hosted KYC
  async getBridgeKYCLink(): Promise<BridgeKYCLinkResponse> {
    return apiClient.get<BridgeKYCLinkResponse>(KYC_ENDPOINTS.BRIDGE_LINK);
  },

  async getBridgeKYCStatus(): Promise<KYCProviderStatus> {
    return apiClient.get<KYCProviderStatus>(KYC_ENDPOINTS.BRIDGE_STATUS);
  },
};

export default kycService;
