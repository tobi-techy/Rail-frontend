import {  VirtualCreditCard } from '@/components';
import { Button } from '@/components/ui';
import { Avatar } from '@rneui/base';
import { useNavigation } from 'expo-router';
import { DotIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const CardScreen = () => {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerLeft: () => (
        <View className='items-start pl-[14px]'>
          <Text className='text-[#000] text-[40px] font-body-bold font-bold '>Card</Text>
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
      headerStyle: {
        backgroundColor: 'transparent',
      },
      title: ""
    })
  }, [navigation]);

  const benefits = [
    {
      title: "Ideal for",
      description: "Gen Z investors, creators, and builders who want their money to work as hard as they do."
    },
    {
      title: "Earn While You Spend",
      description: "Get cashback auto-invested into curated funds or your STACK portfolio — every swipe builds wealth."
    },
    {
      title: "Zero Fees, Full Control",
      description: "No maintenance or FX fees. Real-time spend insights and card controls from the app."
    },
    {
      title: "Gamified Rewards",
      description: "Level up your financial game. Unlock badges, streaks, and rewards for consistent saving and investing."
    },
    {
      title: "Instant Card Access",
      description: "Get your virtual card in seconds. Start using Apple Pay or Google Pay instantly."
    },
    {
      title: "Round-Up Investing",
      description: "Automatically invest your spare change into diversified, smart portfolios."
    },
    {
      title: "Built for Web3",
      description: "Seamlessly connect to your wallet, track on-chain rewards, and explore decentralized investments."
    },
    {
      title: "Security You Can Trust",
      description: "End-to-end encryption, instant freeze controls, and secure tokenized payments."
    }
  ]
  
  return (
    <SafeAreaView className="flex-1 px-[14px]">
    <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
      <VirtualCreditCard />
       <View className='items-center gap-y-1 mt-5'>
        <Text className='text-[34px] font-body-bold leading-normal tracking-wide'>Physical Debit Card</Text>
        <Text className='text-[14px] font-body-light'>Standard metal for every young traders</Text>
       </View>

       <View className='mx-auto bg-slate-100 w-[100%] items-start pl-2 pr-5 py-4 gap-y-4 mt-[20px] rounded-xl'>
        {benefits.map((item, index) => {
          return (
            <View key={index} className='flex-row items-center px-[14px]'>
              <DotIcon size={34} />
              <View>
              <Text className='text-[18px] font-body-bold'>{item.title}</Text>
              <Text className='text-[14px] text-gray-500'>{item.description}</Text>
              </View>
            </View>
          )
        })}
       </View>
    </ScrollView>
       <View className="absolute bottom-0 w-full mx-[14px]">
        <Button title='Join the waitlist' variant='primary' />
       </View>
    </SafeAreaView>
  );
};

export default CardScreen;
