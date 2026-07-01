/**
 * RampHub API Service
 * Unified NGN on/off ramp — best rate via RampHub (primary), Paj fallback.
 * The backend selects the provider automatically; the frontend just calls /ramp/*.
 */

import apiClient from '../client';
import type {
  RampQuote,
  RampBank,
  RampResolvedAccount,
  RampOnrampOrder,
  RampOfframpOrder,
  RampOrderStatus,
  RampOrder,
} from '../types/ramp';

const RAMP_ENDPOINTS = {
  QUOTE: '/v1/funding/ramp/quote',
  BANKS: '/v1/funding/ramp/banks',
  BANKS_RESOLVE: '/v1/funding/ramp/banks/resolve',
  ONRAMP: '/v1/funding/ramp/onramp',
  OFFRAMP: '/v1/funding/ramp/offramp',
  ORDERS: '/v1/funding/ramp/orders',
} as const;

export const rampService = {
  /** Best rate for a corridor (side: 'onramp' | 'offramp') */
  async getQuote(side: 'onramp' | 'offramp', amount: number, currency = 'NGN'): Promise<RampQuote> {
    return apiClient.get(
      `${RAMP_ENDPOINTS.QUOTE}?side=${side}&amount=${amount}&currency=${currency}`
    );
  },

  /** List of Nigerian banks supported across all RampHub providers */
  async getBanks(): Promise<{ banks: RampBank[] }> {
    return apiClient.get(RAMP_ENDPOINTS.BANKS);
  },

  /** Verify a bank account number and return the resolved account name */
  async resolveBankAccount(bankCode: string, accountNumber: string): Promise<RampResolvedAccount> {
    return apiClient.post(RAMP_ENDPOINTS.BANKS_RESOLVE, { bankCode, accountNumber });
  },

  /** Create NGN → USDC deposit order. Returns virtual bank account to pay into. */
  async createOnramp(amount: number, currency = 'NGN'): Promise<RampOnrampOrder> {
    return apiClient.post(RAMP_ENDPOINTS.ONRAMP, { amount, currency });
  },

  /** Create USDC → NGN withdrawal order. USDC is debited; NGN arrives at the bank. */
  async createOfframp(
    bankCode: string,
    accountNumber: string,
    amount: number,
    currency = 'NGN'
  ): Promise<RampOfframpOrder> {
    return apiClient.post(RAMP_ENDPOINTS.OFFRAMP, { bankCode, accountNumber, amount, currency });
  },

  /** Poll the latest status for an order */
  async getOrderStatus(transactionId: string): Promise<RampOrderStatus> {
    return apiClient.get(`${RAMP_ENDPOINTS.ORDERS}/${transactionId}/status`);
  },

  /** Fetch the user's order history */
  async getOrders(): Promise<{ orders: RampOrder[] }> {
    return apiClient.get(RAMP_ENDPOINTS.ORDERS);
  },
};

export default rampService;
