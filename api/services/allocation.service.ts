import apiClient from '../client';
import type {
  AllocationBalancesResponse,
  AllocationModeResponse,
  EnableAllocationModeRequest,
} from '../types';

const ALLOCATION_ENDPOINTS = {
  ENABLE: '/v1/allocation/enable',
  DISABLE: '/v1/allocation/disable',
  BALANCES: '/v1/allocation/balances',
} as const;

const DEFAULT_ENABLE_PAYLOAD: EnableAllocationModeRequest = {
  spending_ratio: 0.7,
  stash_ratio: 0.3,
};

export const allocationService = {
  async getBalances(): Promise<AllocationBalancesResponse> {
    return apiClient.get<AllocationBalancesResponse>(ALLOCATION_ENDPOINTS.BALANCES);
  },

  async enableMode(
    payload: EnableAllocationModeRequest = DEFAULT_ENABLE_PAYLOAD
  ): Promise<AllocationModeResponse> {
    return apiClient.post<AllocationModeResponse>(ALLOCATION_ENDPOINTS.ENABLE, payload);
  },

  async disableMode(): Promise<AllocationModeResponse> {
    return apiClient.post<AllocationModeResponse>(ALLOCATION_ENDPOINTS.DISABLE);
  },
};

export default allocationService;
