import { useMemo, useState, useCallback } from 'react';
import {
  useInvestmentStash,
  useInvestmentTransactions,
  useInvestmentPerformance,
  useInvestmentPositions,
} from '@/api/hooks/useInvestment';
import type {
  InvestmentTradeTransaction,
  InvestmentDistributionItem,
  InvestmentPeriod,
} from '@/api/types/investment';

const PAGE_SIZE = 5;

export function useInvestmentStashData() {
  const [period, setPeriod] = useState<InvestmentPeriod>('1W');
  const { data, isLoading, refetch } = useInvestmentStash();
  const { data: perfData, isLoading: perfLoading } = useInvestmentPerformance(period);
  const { data: positionsData, isLoading: positionsLoading } = useInvestmentPositions({
    page: 1,
    page_size: 50,
  });
  const [txOffset, setTxOffset] = useState(0);

  const { data: txData, isLoading: txLoading } = useInvestmentTransactions({
    limit: PAGE_SIZE,
    offset: txOffset,
    side: 'all',
  });

  const totalBalance = data?.summary?.total_balance?.formatted ?? '$0.00';
  const totalBalanceRaw = parseFloat(data?.summary?.total_balance?.raw ?? '0');
  const investedValue = data?.summary?.invested_value?.formatted ?? '$0.00';
  const buyingPower = data?.summary?.buying_power?.formatted ?? '$0.00';
  const netPnlPct = data?.balance?.net_pnl_percent ?? 0;
  const investmentRule = data?.investment_rule ?? null;

  // Normalised [0,1] values for chart rendering
  const chartPoints = useMemo(() => {
    const pts = perfData?.points ?? [];
    if (pts.length < 2) return [];
    const values = pts.map((p) => parseFloat(p.value.raw));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    return values.map((v) => (v - min) / range);
  }, [perfData?.points]);

  const perfReturn = perfData?.return?.formatted ?? '';
  const perfReturnPct = perfData?.return_percent ?? 0;

  const positions = useMemo(
    () => positionsData?.items ?? data?.holdings_preview ?? [],
    [positionsData?.items, data?.holdings_preview]
  );
  const positionsTotalCount =
    positionsData?.total_count ?? data?.positions?.total_count ?? positions.length;
  const positionsHasMore = positionsData?.has_more ?? positionsTotalCount > positions.length;
  const distribution: InvestmentDistributionItem[] = useMemo(
    () => data?.distribution_preview ?? [],
    [data?.distribution_preview]
  );
  const transactions: InvestmentTradeTransaction[] = useMemo(
    () => txData?.items ?? [],
    [txData?.items]
  );

  const hasMoreTx = txData?.has_more ?? false;
  const hasPrevTx = txOffset > 0;
  const nextPage = useCallback(() => {
    if (hasMoreTx) setTxOffset((o) => o + PAGE_SIZE);
  }, [hasMoreTx]);
  const prevPage = useCallback(() => {
    setTxOffset((o) => Math.max(0, o - PAGE_SIZE));
  }, []);
  const currentPage = Math.floor(txOffset / PAGE_SIZE) + 1;

  return {
    isLoading,
    txLoading,
    perfLoading,
    positionsLoading,
    totalBalance,
    totalBalanceRaw,
    investedValue,
    buyingPower,
    netPnlPct,
    investmentRule,
    period,
    setPeriod,
    chartPoints,
    perfReturn,
    perfReturnPct,
    positions,
    positionsTotalCount,
    positionsHasMore,
    distribution,
    transactions,
    hasMoreTx,
    hasPrevTx,
    currentPage,
    nextPage,
    prevPage,
    refetch,
  };
}
