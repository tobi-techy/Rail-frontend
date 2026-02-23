import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, Settings2 } from 'lucide-react-native';
import { SpendingLineChart } from '@/components/molecules/SpendingLineChart';
import { SpendingCategoryItem } from '@/components/molecules/SpendingCategoryItem';
import { StashCard } from '@/components/molecules/StashCard';
import { TransactionList } from '@/components/molecules/TransactionList';
import { VisaLogo } from '@/assets/svg';
import type { Transaction } from '@/components/molecules/TransactionItem';

// Mock Data for the chart
const mockChartData = [
  { label: 'Jan', value: 0 },
  { label: 'Feb', value: 0 },
  { label: 'Mar', value: 5 },
  { label: 'Apr', value: 15 },
  { label: 'May', value: 15 },
  { label: 'Jun', value: 15 },
];

// Mock Data for Categories
const mockCategories = [
  {
    id: '1',
    title: 'General',
    transactionCount: 1,
    amount: -9.99,
    percentage: 68,
    iconName: 'layers-3',
  },
  {
    id: '2',
    title: 'Transport',
    transactionCount: 1,
    amount: -4.78,
    percentage: 32,
    iconName: 'car',
  },
];

// Mock Data for Transactions
const mockTransactions: Transaction[] = [
  {
    id: 'tx1',
    type: 'withdraw',
    title: 'Food & Dining',
    subtitle: 'Uber Eats',
    amount: 15.0,
    currency: 'USD',
    status: 'completed',
    createdAt: new Date(),
  },
];

const Spending = () => {
  const router = useRouter();

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
          activeOpacity={0.7}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>

        <View className="flex-row gap-3">
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
            activeOpacity={0.7}>
            <Settings2 size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Total Left Section */}
        <View className="mt-2 px-5">
          <Text className="font-body-medium mb-1 text-[16px] text-[#8C8C8C]">Total Left</Text>
          <Text className="font-subtitle text-[56px] leading-[64px] tracking-[-2px] text-black">
            $243.50
          </Text>
          <Text className="font-body text-[14px] text-[#8C8C8C]">Jan – Jun</Text>
        </View>

        {/* Chart Section — full bleed, breaks out of padding */}
        <View className="mt-6" style={{ marginHorizontal: -20 }}>
          <SpendingLineChart
            data={mockChartData}
            lineColor="#000000"
            gradientColors={['rgba(0,0,0,0.12)', 'rgba(0,0,0,0)']}
          />
        </View>

        {/* Virtual Card (Stash Card) Section */}
        <View className="mt-10 px-5">
          <Text className="font-body-medium mb-4 text-[20px] text-black">Your Card</Text>
          <View className="w-full pl-[2px]">
            <StashCard
              title="Rail+ Card"
              amount="$0"
              amountCents=".00"
              icon={<VisaLogo color={'#000'} width={36} height={24} />}
            />
          </View>
        </View>

        {/* Categories Section */}
        <View className="mt-10 px-5">
          <View className="mb-2 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="font-body-medium mr-2 text-[20px] text-black">By Category</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              className="items-center justify-center p-2 pb-1 pt-1">
              <Text className="font-body-medium text-[15px] text-[#2563EB]">Manage</Text>
            </TouchableOpacity>
          </View>

          {/* Category rows with dividers */}
          <View>
            {mockCategories.map((category, index) => (
              <View key={category.id}>
                <SpendingCategoryItem
                  id={category.id}
                  title={category.title}
                  transactionCount={category.transactionCount}
                  amount={category.amount}
                  percentage={category.percentage}
                  iconName={category.iconName}
                  onPress={() => {}}
                />
                {index < mockCategories.length - 1 && <View className="h-px bg-gray-100" />}
              </View>
            ))}
          </View>
        </View>

        {/* Recent Transactions Section */}
        <View className="mt-10 px-5">
          <TransactionList
            transactions={mockTransactions}
            title="Recent Activity"
            onTransactionPress={() => {}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Spending;
