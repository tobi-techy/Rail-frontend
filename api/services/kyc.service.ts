import apiClient from '../client';
import type {
  StartDiditSessionRequest,
  StartDiditSessionResponse,
  KYCStatusResponse,
  KYCProviderStatus,
  BridgeKYCLinkResponse,
  SubmitKYCRequest,
  SubmitKYCResponse,
  SproutUpgradeRequest,
  SproutUpgradeResponse,
  BloomUpgradeRequest,
  BloomUpgradeResponse,
} from '../types';

const KYC_ENDPOINTS = {
  DIDIT_SESSION: '/v1/kyc/didit/session',
  SUBMIT: '/v1/kyc/submit',
  STATUS: '/v1/kyc/status',
  BRIDGE_LINK: '/v1/kyc/bridge/link',
  BRIDGE_STATUS: '/v1/kyc/bridge/status',
  SPROUT_UPGRADE: '/v1/kyc/sprout/upgrade',
  BLOOM_UPGRADE: '/v1/kyc/bloom/upgrade',
} as const;

export const kycService = {
  async startDiditSession(
    data?: Partial<StartDiditSessionRequest>
  ): Promise<StartDiditSessionResponse> {
    return apiClient.post<StartDiditSessionResponse>(KYC_ENDPOINTS.DIDIT_SESSION, data ?? {});
  },

  async submitKYC(data: SubmitKYCRequest): Promise<SubmitKYCResponse> {
    return apiClient.post<SubmitKYCResponse>(KYC_ENDPOINTS.SUBMIT, data);
  },

  async getKYCStatus(): Promise<KYCStatusResponse> {
    return apiClient.get<KYCStatusResponse>(KYC_ENDPOINTS.STATUS);
  },

  // Tier 2 — Sprout (NGN account)
  async sproutUpgrade(data: SproutUpgradeRequest): Promise<SproutUpgradeResponse> {
    return apiClient.post<SproutUpgradeResponse>(KYC_ENDPOINTS.SPROUT_UPGRADE, data);
  },

  // Tier 3 — Bloom (Bridge hosted KYC)
  async bloomUpgrade(data: BloomUpgradeRequest): Promise<BloomUpgradeResponse> {
    return apiClient.post<BloomUpgradeResponse>(KYC_ENDPOINTS.BLOOM_UPGRADE, data);
  },

  async getBridgeKYCLink(): Promise<BridgeKYCLinkResponse> {
    return apiClient.get<BridgeKYCLinkResponse>(KYC_ENDPOINTS.BRIDGE_LINK);
  },

  async getBridgeKYCStatus(): Promise<KYCProviderStatus> {
    return apiClient.get<KYCProviderStatus>(KYC_ENDPOINTS.BRIDGE_STATUS);
  },
};

export default kycService;
