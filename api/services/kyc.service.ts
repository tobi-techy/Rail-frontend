import apiClient from '../client';
import type {
  StartDiditSessionRequest,
  StartDiditSessionResponse,
  KYCStatusResponse,
  BridgeKYCLinkResponse,
  SubmitKYCRequest,
  SubmitKYCResponse,
} from '../types';

const KYC_ENDPOINTS = {
  DIDIT_SESSION: '/v1/kyc/didit/session',
  SUBMIT: '/v1/kyc/submit',
  STATUS: '/v1/kyc/status',
  BRIDGE_LINK: '/v1/kyc/bridge/link',
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

  // Legacy — kept for backward compat
  async getBridgeKYCLink(): Promise<BridgeKYCLinkResponse> {
    return apiClient.get<BridgeKYCLinkResponse>(KYC_ENDPOINTS.BRIDGE_LINK);
  },
};

export default kycService;
