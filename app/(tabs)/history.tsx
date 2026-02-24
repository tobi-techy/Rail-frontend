import { useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { Text, View, ScrollView } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { TransactionList } from '@/components/molecules/TransactionList';
import { Transaction } from '@/components/molecules/TransactionItem';
import { TransactionDetailSheet } from '@/components/sheets/TransactionDetailSheet';

// Token SVGs
import UsdcIcon from '@/assets/svg/usdc.svg';
import UsdtIcon from '@/assets/svg/usdt.svg';
import SolanaIcon from '@/assets/svg/solana.svg';
import NgnIcon from '@/assets/svg/ngn.svg';

const emptyStateSvg = `<svg width="260" height="110" viewBox="0 0 520 220" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="30" y="40" width="460" height="140" rx="26" stroke="#D1D5DB" stroke-width="3"/>
  <rect x="58" y="78" width="44" height="44" rx="10" stroke="#D1D5DB" stroke-width="3"/>
  <path d="M80 112V90" stroke="#D1D5DB" stroke-width="3" stroke-linecap="round"/>
  <path d="M72 98L80 90L88 98" stroke="#D1D5DB" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="120" y="80" width="120" height="18" rx="9" fill="#E5E7EB"/>
  <rect x="120" y="110" width="220" height="18" rx="9" fill="#E5E7EB"/>
</svg>`;

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'send',
    title: 'USDC',
    subtitle: 'To 6D7M...2PWA',
    amount: 24.008,
    currency: 'USDC',
    status: 'completed',
    createdAt: new Date(),
    toAddress: '6D7MqPzLK8re2PWA',
    txHash: '5iFyKLm9xwEaq',
    fee: 'Rail Covered',
    icon: { type: 'token', Token: UsdcIcon, bgColor: '#2775CA' },
  },
  {
    id: '2',
    type: 'receive',
    title: 'NGN',
    subtitle: 'From Adewale',
    amount: 150000,
    currency: 'NGN',
    status: 'completed',
    createdAt: new Date(),
    toAddress: '0x8c82a7b1ba1',
    icon: { type: 'token', Token: NgnIcon, bgColor: '#00C853' },
  },
  {
    id: '3',
    type: 'send',
    title: 'NGN',
    subtitle: 'To Chioma',
    amount: 25000,
    currency: 'NGN',
    status: 'pending',
    createdAt: new Date(),
    toAddress: '0x9d93b8c2cb2',
    icon: { type: 'token', Token: NgnIcon, bgColor: '#00C853' },
  },
  {
    id: '4',
    type: 'swap',
    title: 'NGN → USDC',
    subtitle: 'Via Rail Exchange',
    amount: 50000,
    currency: 'NGN',
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000),
    txHash: '7gHzNOp2yRsbt',
    fee: 'Rail Covered',
    icon: { type: 'swap', SwapFrom: NgnIcon, SwapTo: UsdcIcon, swapFromBg: '#00C853', swapToBg: '#2775CA' },
  },
  {
    id: '5',
    type: 'withdraw',
    title: 'Bank Withdrawal',
    subtitle: 'GTBank ••• 4521',
    amount: 75000,
    currency: 'NGN',
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000),
    icon: { type: 'icon', iconName: 'credit-card' },
  },
  {
    id: '6',
    type: 'receive',
    title: 'USDT',
    subtitle: 'From Emeka',
    amount: 320,
    currency: 'USDT',
    status: 'completed',
    createdAt: new Date(Date.now() - 172800000),
    toAddress: '0xabc123def456',
    txHash: '8hIaOPq3zStcu',
    icon: { type: 'token', Token: UsdtIcon, bgColor: '#26A17B' },
  },
  {
    id: '7',
    type: 'deposit',
    title: 'Card Deposit',
    subtitle: 'Mastercard ••• 8834',
    amount: 100000,
    currency: 'NGN',
    status: 'completed',
    createdAt: new Date(Date.now() - 259200000),
    icon: { type: 'icon', iconName: 'plus-circle' },
  },
  {
    id: '8',
    type: 'receive',
    title: 'SOL',
    subtitle: 'From 5F1se...exUq1',
    amount: 2.5,
    currency: 'SOL',
    status: 'completed',
    createdAt: new Date(Date.now() - 345600000),
    toAddress: '5F1seKLmexUq1',
    txHash: '9iJbPQr4ATudv',
    icon: { type: 'token', Token: SolanaIcon, bgColor: '#000000' },
  },
];

const EmptyState = () => (
  <View className="flex-1 items-center justify-center px-xl">
    <SvgXml xml={emptyStateSvg} width={260} height={110} />
    <Text className="mt-lg text-center font-subtitle text-subtitle text-text-primary">No transactions yet</Text>
    <Text className="mt-xs text-center font-caption text-caption text-text-secondary">
      Your transaction history will appear here once you start using Rail
    </Text>
  </View>
);

export default function History() {
  const navigation = useNavigation();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <View className="flex-row items-center gap-x-3 pl-md">
          <Text className="font-subtitle text-headline-1 text-text-primary">History</Text>
        </View>
      ),
      headerShown: true,
      title: '',
      headerStyle: { backgroundColor: 'transparent' },
    });
  }, [navigation]);

  return (
    <View className="flex-1 bg-background-main">
      {mockTransactions.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView className="flex-1 px-md" showsVerticalScrollIndicator={false}>
          <TransactionList
            transactions={mockTransactions}
            onTransactionPress={setSelectedTransaction}
            className="pt-md"
          />
        </ScrollView>
      )}

      <TransactionDetailSheet
        visible={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
      />
    </View>
  );
}
