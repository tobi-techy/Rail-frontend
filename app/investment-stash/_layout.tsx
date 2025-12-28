import React from 'react';
import { Tabs } from 'expo-router';
import { CreditCard, Home, PieChart } from 'lucide-react-native';

import { TabBar } from '@/components/TabBar';

export default function InvestmentStash() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#fff' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home size={24} color={color} fill={focused ? '#FF5A00' : '#fff'} />
          ),
        }}
      />

    </Tabs>
  );
}
