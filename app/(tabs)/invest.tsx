import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import React, { useLayoutEffect, useState } from 'react';
import { useNavigation } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Avatar } from '@rneui/base';
import { CategoryCard } from '@/components/molecules/CategoryCard';
import { avatar, cards, checkmark } from '@/assets/images';
import FinanceIcon from '@/assets/Icons/finance-26.svg';
import DataExplorationIcon from '@/assets/Icons/data-exploration-20.svg';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { colors } from '@/design/tokens';

const Invest = () => {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerLeft: () => (
        <View className='items-start pl-[14px]'>
          <Text className='text-[#000] text-[40px] font-body-bold font-bold '>Invest</Text>
        </View>
      ),
      headerRight: () => (
        <View className='flex-row gap-x-[12px] items-center pr-[14px]'>
          <Avatar
            size={40}
            rounded
            title="Fc"
            containerStyle={{ backgroundColor: '#3d4db7' }}
          />
        </View>
      ),
      title: "",
      headerStyle: {
        backgroundColor: 'transparent',
      },
    })
  }, [navigation]);

  const [activeFilter, setActiveFilter] = useState<'top-baskets' | 'top-investors'>('top-baskets');
  const [copiedInvestorId, setCopiedInvestorId] = useState<string | null>(null);

  const categories = [
    {
      id: 'defi',
      title: 'DeFi',
      basketsCount: 86,
      performancePercent: 62.15,
      icon: FinanceIcon,
      iconGradient: ['#F5F5FF', '#D6E4FF'] as const,
    },
    {
      id: 'gaming',
      title: 'Gaming',
      basketsCount: 19,
      performancePercent: 1.24,
      icon: DataExplorationIcon,
      iconGradient: ['#FFF5F7', '#E4E8FF'] as const,
    },
    {
      id: 'metaverse',
      title: 'Metaverse',
      basketsCount: 43,
      performancePercent: -4.87,
      icon: FinanceIcon,
      iconGradient: ['#F6F8FF', '#E3F7FF'] as const,
    },
    {
      id: 'ai',
      title: 'AI & Data',
      basketsCount: 52,
      performancePercent: 18.96,
      icon: DataExplorationIcon,
      iconGradient: ['#FFF5F7', '#E4E8FF'] as const,
    },
  ];

  const topBaskets = [
    {
      id: 'quantum-growth',
      name: 'Quantum Growth',
      description: 'High momentum tech innovators with strong revenue expansion.',
      riskLevel: 'HIGH' as const,
      iconUrl: cards,
      performanceIndicator: {
        returnPercentage: 28.4,
        totalInvested: 1325000,
        currentValue: 1702000,
      },
    },
    {
      id: 'green-energy',
      name: 'Green Energy Leaders',
      description: 'Renewables, storage, and grid pioneers leading the transition.',
      riskLevel: 'MEDIUM' as const,
      iconUrl: checkmark,
      performanceIndicator: {
        returnPercentage: 18.9,
        totalInvested: 980000,
        currentValue: 1165000,
      },
    },
    {
      id: 'stability-plus',
      name: 'Stability Plus',
      description: 'Defensive staples and dividend aristocrats for steady growth.',
      riskLevel: 'LOW' as const,
      iconUrl: avatar,
      performanceIndicator: {
        returnPercentage: 12.1,
        totalInvested: 1540000,
        currentValue: 1726000,
      },
    },
  ];

  const topInvestors = [
    {
      id: 'investor-olivia',
      name: 'Olivia Chen',
      username: 'olivia-trades',
      followers: 42500,
      aum: 875000,
      roi30d: 22.6,
      specialty: 'AI Momentum',
      copyCode: 'OLIVIA22',
      accentColor: colors.primary.lavender,
    },
    {
      id: 'investor-isaac',
      name: 'Isaac Grant',
      username: 'isaac-grant',
      followers: 36800,
      aum: 642000,
      roi30d: 17.4,
      specialty: 'Sustainable Growth',
      copyCode: 'GRANT17',
      accentColor: colors.semantic.success,
    },
    {
      id: 'investor-sofia',
      name: 'Sofia Martins',
      username: 'alpha-sofia',
      followers: 51200,
      aum: 1025000,
      roi30d: 25.1,
      specialty: 'Quant Value Mix',
      copyCode: 'SOFIA25',
      accentColor: colors.primary.magenta,
    },
  ];

  const filterOptions: { id: 'top-baskets' | 'top-investors'; label: string }[] = [
    { id: 'top-baskets', label: 'Top Baskets' },
    { id: 'top-investors', label: 'Top Investors' },
  ];

  const formatCompactCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(amount);
    } catch {
      const abs = Math.abs(amount);
      const sign = amount < 0 ? '-' : '';
      if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
      if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
      if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
      return `${sign}$${abs.toFixed(0)}`;
    }
  };

  const formatCompactNumber = (value: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(value);
    } catch {
      const abs = Math.abs(value);
      if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(1)}B`;
      if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)}M`;
      if (abs >= 1_000) return `${(abs / 1_000).toFixed(1)}K`;
      return `${abs.toFixed(0)}`;
    }
  };

  const handleCopy = async (code: string, investorId: string) => {
    try {
      await Clipboard.setStringAsync(code);
      setCopiedInvestorId(investorId);
      setTimeout(() => setCopiedInvestorId((current) => (current === investorId ? null : current)), 2000);
    } catch (error) {
      console.warn('Unable to copy code', error);
    }
  };
  
  return (
    <KeyboardAwareScrollView className="flex-1" keyboardShouldPersistTaps="handled">
      <View className="flex-row items-center gap-x-3 mx-auto">
        <View className='bg-gray-100 mt-6 w-[80%] h-[50px] flex-row items-center px-2 rounded-full'>
          <TextInput className='flex-1 pl-2' placeholder='Search Stocks, Etfs & investors' />
          <Search size={18} color={"#d1d5db"} />
        </View>
        <View className='bg-gray-200 mt-5 h-[50px] w-[50px] items-center justify-center rounded-full'>
          <SlidersHorizontal />
        </View>
      </View>
      <View className="px-[14px] py-4 mt-[14px]">
        <Text className="text-[24px] font-body-bold mb-3">Categories</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 24 }}
        >
          {categories.map(({ id: categoryId, title, basketsCount, performancePercent, icon, iconGradient }, index) => (
            <View
              key={categoryId}
              className="w-[220px]"
              style={{ marginRight: index === categories.length - 1 ? 0 : 16 }}
            >
              <CategoryCard
                id={categoryId}
                title={title}
                basketsCount={basketsCount}
                performancePercent={performancePercent}
                icon={icon}
                iconGradient={iconGradient}
                tokenLogos={[avatar, cards, checkmark]}
                onPress={() => {}}
              />
            </View>
          ))}
        </ScrollView>
      </View>


      <View className="px-[14px] py-4 mt-[14px]">
      <Text className="text-[24px] font-body-bold mb-3">Top 10 basket in Tech</Text>
      <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 24 }}
        >
          {categories.map(({ id: categoryId, title, basketsCount, performancePercent, icon, iconGradient }, index) => (
            <View
              key={categoryId}
              className="w-[220px]"
              style={{ marginRight: index === categories.length - 1 ? 0 : 16 }}
            >
              <CategoryCard
                id={categoryId}
                title={title}
                basketsCount={basketsCount}
                performancePercent={performancePercent}
                icon={icon}
                iconGradient={iconGradient}
                tokenLogos={[avatar, cards, checkmark]}
                onPress={() => {}}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      <View className="px-[14px] py-4 mt-[14px]">
      <Text className="text-[24px] font-body-bold mb-3">Top investors to watch</Text>
      <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 24 }}
        >
          {categories.map(({ id: categoryId, title, basketsCount, performancePercent, icon, iconGradient }, index) => (
            <View
              key={categoryId}
              className="w-[220px]"
              style={{ marginRight: index === categories.length - 1 ? 0 : 16 }}
            >
              <CategoryCard
                id={categoryId}
                title={title}
                basketsCount={basketsCount}
                performancePercent={performancePercent}
                icon={icon}
                iconGradient={iconGradient}
                tokenLogos={[avatar, cards, checkmark]}
                onPress={() => {}}
              />
            </View>
          ))}
        </ScrollView>
      </View>

    </KeyboardAwareScrollView>
  );
};

export default Invest;
