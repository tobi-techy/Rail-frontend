/**
 * Paj Cash API Service
 * NGN on/off ramp — fund with Naira, withdraw to local bank account
 */

import apiClient from '../client';
import type {
  PajRatesResponse,
  PajBank,
  PajResolvedAccount,
  PajSavedBankAccount,
  PajOnrampOrder,
  PajOfframpOrder,
  PajOrderStatus,
} from '../types/paj';

const PAJ_ENDPOINTS = {
  INITIATE: '/v1/funding/paj/initiate',
  VERIFY: '/v1/funding/paj/verify',
  RATES: '/v1/funding/paj/rates',
  BANKS: '/v1/funding/paj/banks',
  BANKS_RESOLVE: '/v1/funding/paj/banks/resolve',
  BANKS_ADD: '/v1/funding/paj/banks/add',
  BANKS_SAVED: '/v1/funding/paj/banks/saved',
  ONRAMP: '/v1/funding/paj/onramp',
  OFFRAMP: '/v1/funding/paj/offramp',
  ORDER_STATUS: '/v1/funding/paj/orders', // + /:id/status
} as const;

export const pajService = {
  /** Trigger OTP to user's email for Paj session */
  async initiate(): Promise<{ status: string; email: string }> {
    return apiClient.post(PAJ_ENDPOINTS.INITIATE);
  },

  /** Verify OTP and establish Paj session */
  async verify(otp: string): Promise<{ status: string }> {
    return apiClient.post(PAJ_ENDPOINTS.VERIFY, { otp });
  },

  /** Get current NGN/USD exchange rates */
  async getRates(): Promise<PajRatesResponse> {
    return apiClient.get(PAJ_ENDPOINTS.RATES);
  },

  /** Get list of Nigerian banks */
  async getBanks(): Promise<{ banks: PajBank[] }> {
    return apiClient.get(PAJ_ENDPOINTS.BANKS);
  },

  /** Verify a bank account number and get the account name */
  async resolveBankAccount(bankId: string, accountNumber: string): Promise<PajResolvedAccount> {
    return apiClient.post(PAJ_ENDPOINTS.BANKS_RESOLVE, { bankId, accountNumber });
  },

  /** Save a bank account for future withdrawals */
  async addBankAccount(bankId: string, accountNumber: string): Promise<PajSavedBankAccount> {
    return apiClient.post(PAJ_ENDPOINTS.BANKS_ADD, { bankId, accountNumber });
  },

  /** Get user's saved bank accounts */
  async getSavedBanks(): Promise<{ accounts: PajSavedBankAccount[] }> {
    return apiClient.get(PAJ_ENDPOINTS.BANKS_SAVED);
  },

  /** Create NGN → USDC deposit order. Returns bank account to pay. */
  async createOnramp(amount: number, currency = 'NGN'): Promise<PajOnrampOrder> {
    return apiClient.post(PAJ_ENDPOINTS.ONRAMP, { amount, currency });
  },

  /** Create USDC → NGN withdrawal order. Sends NGN to user's bank. */
  async createOfframp(
    bankId: string,
    accountNumber: string,
    amount: number,
    currency = 'NGN'
  ): Promise<PajOfframpOrder> {
    return apiClient.post(PAJ_ENDPOINTS.OFFRAMP, { bankId, accountNumber, amount, currency });
  },

  /** Poll order status from Paj */
  async getOrderStatus(orderId: string): Promise<PajOrderStatus> {
    return apiClient.get(`${PAJ_ENDPOINTS.ORDER_STATUS}/${orderId}/status`);
  },

  /** Get user's Paj order history for transaction display */
  async getOrders(): Promise<{ orders: PajOrderStatus[] }> {
    return apiClient.get(PAJ_ENDPOINTS.ORDER_STATUS);
  },
};

export default pajService;
