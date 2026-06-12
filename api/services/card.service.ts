import apiClient from '../client';
import type {
  CardListResponse,
  CreateCardRequest,
  CreateCardResponse,
  CardDetails,
  CardTransactionListResponse,
} from '../types/card';

const ENDPOINTS = {
  CARDS: '/v1/cards',
  CARD: (id: string) => `/v1/cards/${id}`,
  FREEZE: (id: string) => `/v1/cards/${id}/freeze`,
  UNFREEZE: (id: string) => `/v1/cards/${id}/unfreeze`,
  TRANSACTIONS: '/v1/cards/transactions',
  CARD_TRANSACTIONS: (id: string) => `/v1/cards/${id}/transactions`,
  EPHEMERAL_KEY: (id: string) => `/v1/cards/${id}/ephemeral-key`,
  PIN_URL: (id: string) => `/v1/cards/${id}/pin-url`,
  STATEMENT: (id: string) => `/v1/cards/${id}/statement`,
  LIMIT: (id: string) => `/v1/cards/${id}/limit`,
} as const;

export interface EphemeralKeyResponse {
  ephemeral_key: string;
  client_secret: string;
  nonce: string;
}

export interface PINUrlResponse {
  url: string;
}

export interface StatementResponse {
  url: string;
  expires_at: string;
}

export const cardService = {
  getCards: () => apiClient.get<CardListResponse>(ENDPOINTS.CARDS),

  getCard: (id: string) => apiClient.get<CardDetails>(ENDPOINTS.CARD(id)),

  createCard: (req: CreateCardRequest) => apiClient.post<CreateCardResponse>(ENDPOINTS.CARDS, req),

  freezeCard: (id: string) =>
    apiClient.post<{ message: string; card: CardDetails }>(ENDPOINTS.FREEZE(id)),

  unfreezeCard: (id: string) =>
    apiClient.post<{ message: string; card: CardDetails }>(ENDPOINTS.UNFREEZE(id)),

  getTransactions: (params?: { limit?: number; offset?: number }) =>
    apiClient.get<CardTransactionListResponse>(ENDPOINTS.TRANSACTIONS, { params }),

  getCardTransactions: (id: string, params?: { limit?: number; offset?: number }) =>
    apiClient.get<CardTransactionListResponse>(ENDPOINTS.CARD_TRANSACTIONS(id), { params }),

  getEphemeralKey: (id: string, clientNonce: string) =>
    apiClient.post<{ ephemeral_key: string }>(ENDPOINTS.EPHEMERAL_KEY(id), {
      client_nonce: clientNonce,
    }),

  getPINUrl: (id: string) => apiClient.post<PINUrlResponse>(ENDPOINTS.PIN_URL(id)),

  getStatement: (id: string, params?: { month?: string; year?: string }) =>
    apiClient.get<StatementResponse>(ENDPOINTS.STATEMENT(id), { params }),

  setDailyLimit: (id: string, limitCents: number | null) =>
    apiClient.put<{ daily_limit_cents: number | null }>(ENDPOINTS.LIMIT(id), {
      limit_cents: limitCents,
    }),
};
