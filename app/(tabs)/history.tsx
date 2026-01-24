import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Text, View, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';

const transactionsEmptySvg = `<svg width="520" height="220" viewBox="0 0 520 220" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="30" y="40" width="460" height="140" rx="26" stroke="#D1D5DB" stroke-width="3"/>
  <rect x="58" y="78" width="44" height="44" rx="10" stroke="#D1D5DB" stroke-width="3"/>
  <path d="M80 112V90" stroke="#D1D5DB" stroke-width="3" stroke-linecap="round"/>
  <path d="M72 98L80 90L88 98" stroke="#D1D5DB" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="120" y="80" width="120" height="18" rx="9" fill="#E5E7EB"/>
  <rect x="120" y="110" width="220" height="18" rx="9" fill="#E5E7EB"/>
  <path d="M40 60C66 26 126 20 260 20C394 20 454 26 480 60" stroke="#D1D5DB" stroke-width="3" opacity="0.35"/>
  <path d="M40 160C66 194 126 200 260 200C394 200 454 194 480 160" stroke="#D1D5DB" stroke-width="3" opacity="0.35"/>
</svg>`;

type Transaction = {
  id: string;
  title: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  date: string;
};

const transactions: Transaction[] = [];

const TransactionItem = ({ item }: { item: Transaction }) => (
  <View className="flex-row items-center px-md py-sm border-b border-surface">
    <View className="w-10 h-10 rounded-full bg-surface items-center justify-center mr-sm">
      <Ionicons
        name={item.type === 'credit' ? 'arrow-down' : 'arrow-up'}
        size={20}
        color={item.type === 'credit' ? '#00C853' : '#121212'}
      />
    </View>
    <View className="flex-1">
      <Text className="text-body font-subtitle text-text-primary">{item.title}</Text>
      <Text className="text-caption font-caption text-text-secondary">{item.description}</Text>
    </View>
    <View className="items-end">
      <Text className={`text-body font-subtitle ${item.type === 'credit' ? 'text-success' : 'text-text-primary'}`}>
        {item.type === 'credit' ? '+' : '-'}${Math.abs(item.amount).toFixed(2)}
      </Text>
      <Text className="text-caption font-caption text-text-secondary">{item.date}</Text>
    </View>
  </View>
);

const EmptyState = () => (
  <View className="flex-1 items-center justify-center px-xl">
    <SvgXml xml={transactionsEmptySvg} width={260} height={110} />
    <Text className="text-subtitle font-subtitle text-text-primary mt-lg text-center">No transactions yet</Text>
    <Text className="text-caption font-caption text-text-secondary mt-xs text-center">
      Your transaction history will appear here once you start using Rail
    </Text>
  </View>
);

export default function History() {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <View className="flex-row items-center gap-x-3 pl-[14px]">
          <Text className="font-subtitle text-headline-1">History</Text>
        </View>
      ),
      headerShown: true,
      title: '',
      headerStyle: { backgroundColor: 'transparent' },
    });
  }, [navigation]);

  return (
    <View className="flex-1 bg-background-main">
      {transactions.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransactionItem item={item} />}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );
}
