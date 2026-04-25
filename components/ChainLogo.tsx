import React from 'react';
import {
  SolanaIcon, EthereumIcon, BaseIcon, ArbitrumIcon, OptimismIcon,
  MaticIcon, AvalancheIcon, BnbIcon, StarknetIcon, LiskIcon,
} from '@/assets/svg';
import { getChainConfig } from '@/utils/chains';
import { Text } from 'react-native';

const CHAIN_SVG: Record<string, React.ComponentType<{ width: number; height: number }>> = {
  SOL: SolanaIcon,
  ETH: EthereumIcon,
  BASE: BaseIcon,
  ARB: ArbitrumIcon,
  OP: OptimismIcon,
  MATIC: MaticIcon,
  AVAX: AvalancheIcon,
  BSC: BnbIcon,
  BNB: BnbIcon,
  STARKNET: StarknetIcon,
  LISK: LiskIcon,
};

export function ChainLogo({ chain, size = 28 }: { chain: string; size?: number }) {
  const Svg = CHAIN_SVG[chain];
  if (Svg) return <Svg width={size} height={size} />;
  // Fallback: short text label in chain color
  const config = getChainConfig(chain as any);
  return (
    <Text style={{ fontSize: size * 0.36, fontWeight: '700', color: config.color, letterSpacing: -0.5 }}>
      {config.shortLabel.slice(0, 4)}
    </Text>
  );
}
