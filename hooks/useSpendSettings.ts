import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_BASE_ALLOCATION = 70;
const MIN_BASE_ALLOCATION = 1;
const MAX_BASE_ALLOCATION = 99;

export const clampAlloc = (v: number) =>
  Number.isFinite(v)
    ? Math.min(MAX_BASE_ALLOCATION, Math.max(MIN_BASE_ALLOCATION, Math.round(v)))
    : DEFAULT_BASE_ALLOCATION;

export function useSpendSettings() {
  const [baseAllocation, setBaseAllocation] = useState(DEFAULT_BASE_ALLOCATION);
  const [autoInvestEnabled, setAutoInvestEnabled] = useState(false);
  const [roundupsEnabled, setRoundupsEnabled] = useState(true);
  const [spendingLimit, setSpendingLimit] = useState(500);

  useEffect(() => {
    AsyncStorage.multiGet([
      'baseAllocation',
      'autoInvestEnabled',
      'roundupsEnabled',
      'spendingLimit',
    ]).then((values) => {
      values.forEach(([key, value]) => {
        if (value === null) return;
        if (key === 'baseAllocation') setBaseAllocation(clampAlloc(Number(value)));
        else if (key === 'autoInvestEnabled') setAutoInvestEnabled(value === 'true');
        else if (key === 'roundupsEnabled') setRoundupsEnabled(value === 'true');
        else if (key === 'spendingLimit') setSpendingLimit(Number(value));
      });
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      AsyncStorage.multiSet([
        ['baseAllocation', String(baseAllocation)],
        ['autoInvestEnabled', String(autoInvestEnabled)],
        ['roundupsEnabled', String(roundupsEnabled)],
        ['spendingLimit', String(spendingLimit)],
      ]);
    }, 300);
    return () => clearTimeout(t);
  }, [baseAllocation, autoInvestEnabled, roundupsEnabled, spendingLimit]);

  return {
    baseAllocation,
    setBaseAllocation,
    autoInvestEnabled,
    setAutoInvestEnabled,
    roundupsEnabled,
    setRoundupsEnabled,
    spendingLimit,
    setSpendingLimit,
    MIN_BASE_ALLOCATION,
    MAX_BASE_ALLOCATION,
  };
}
