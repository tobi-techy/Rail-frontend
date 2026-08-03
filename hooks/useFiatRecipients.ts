import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIAT_RECIPIENTS_KEY = 'rail:fiat_recent_recipients';

export interface FiatRecipient {
  id: string;
  accountHolderName: string;
  accountNumber: string;
  routingNumber: string;
  currency: string;
  lastUsed: number;
}

async function loadRecipients(currency?: string): Promise<FiatRecipient[]> {
  try {
    const raw = await AsyncStorage.getItem(FIAT_RECIPIENTS_KEY);
    const all: FiatRecipient[] = raw ? JSON.parse(raw) : [];
    return currency ? all.filter((r) => r.currency === currency) : all;
  } catch {
    return [];
  }
}

async function saveRecipient(r: Omit<FiatRecipient, 'id' | 'lastUsed'>): Promise<void> {
  const all = await loadRecipients();
  const key = `${r.currency}-${r.routingNumber}-${r.accountNumber}`;
  const idx = all.findIndex((x) => x.id === key);
  const entry: FiatRecipient = { ...r, id: key, lastUsed: Date.now() };
  if (idx >= 0) all[idx] = entry;
  else all.unshift(entry);
  await AsyncStorage.setItem(FIAT_RECIPIENTS_KEY, JSON.stringify(all.slice(0, 50)));
}

export function useFiatRecipients(currency: string) {
  const [recipients, setRecipients] = useState<FiatRecipient[]>([]);

  useEffect(() => {
    loadRecipients(currency).then(setRecipients);
  }, [currency]);

  const save = useCallback(
    (r: Omit<FiatRecipient, 'id' | 'lastUsed' | 'currency'>) => {
      return saveRecipient({ ...r, currency });
    },
    [currency]
  );

  return { recipients, save };
}
