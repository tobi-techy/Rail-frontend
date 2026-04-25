import apiClient from '../client';

const BASE = '/v1/premium';

export const premiumService = {
  // Tier 1
  getNairaShield: () => apiClient.get(`${BASE}/naira-shield`),
  getBlackTaxSummary: () => apiClient.get(`${BASE}/black-tax`),
  setBlackTaxBudget: (monthlyLimit: string, alertThresholdPct: number) =>
    apiClient.post(`${BASE}/black-tax/budget`, { monthly_limit: monthlyLimit, alert_threshold_pct: alertThresholdPct }),
  syncBlackTaxRecipients: () => apiClient.post(`${BASE}/black-tax/sync-recipients`),
  splitReceipt: (receiptId: string, assignments: Record<string, string>) =>
    apiClient.post(`${BASE}/receipts/split`, { receipt_id: receiptId, assignments }),

  // Tier 2
  checkMerchant: (merchantName: string) =>
    apiClient.post(`${BASE}/scam/check-merchant`, { merchant_name: merchantName }),
  getScamAlerts: () => apiClient.get(`${BASE}/scam/alerts`),
  dismissScamAlert: (alertId: string) =>
    apiClient.post(`${BASE}/scam/alerts/${alertId}/dismiss`),
  logLocation: (country: string, source?: string) =>
    apiClient.post(`${BASE}/tax/location`, { country, source: source ?? 'manual' }),
  getTaxResidency: () => apiClient.get(`${BASE}/tax/residency`),
  setTaxProfile: (data: {
    primary_tax_country: string;
    secondary_tax_country?: string;
    alert_threshold?: number;
  }) => apiClient.post(`${BASE}/tax/profile`, data),
  getIncomeForecast: () => apiClient.get(`${BASE}/income/forecast`),

  // Tier 3
  getWellnessScore: () => apiClient.get(`${BASE}/wellness/score`),
  generateVisaProof: (visaCountry: string, visaType: string) =>
    apiClient.post(`${BASE}/visa-proof`, { visa_country: visaCountry, visa_type: visaType }),
  getVisaProofs: () => apiClient.get(`${BASE}/visa-proof`),
  getEmergencyContacts: () => apiClient.get(`${BASE}/emergency/contacts`),
  addEmergencyContact: (name: string, phone: string, relation: string, priority?: number) =>
    apiClient.post(`${BASE}/emergency/contacts`, { name, phone, relation, priority: priority ?? 1 }),
  removeEmergencyContact: (contactId: string) =>
    apiClient.delete(`${BASE}/emergency/contacts/${contactId}`),
  triggerEmergencyLock: (reason?: string) =>
    apiClient.post(`${BASE}/emergency/lock`, { reason: reason ?? 'user_triggered' }),
  getEmergencyLock: () => apiClient.get(`${BASE}/emergency/lock`),
};

export default premiumService;
