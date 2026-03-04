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
} as const;

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
};
