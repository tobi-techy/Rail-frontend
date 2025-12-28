import React from 'react';
import { Tabs } from 'expo-router';
import { CreditCard, DollarSign, Home, PieChart } from 'lucide-react-native';

import { TabBar } from '@/components/TabBar';

export default function SpendingStash() {
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
            <DollarSign size={24} color={color} fill={focused ? '#FF5A00' : '#fff'} />
          ),
        }}
      />
      <Tabs.Screen
        name="card"
        options={{
          title: 'Card',
          tabBarIcon: ({ color, focused }) => (
            <CreditCard size={24} color={color} fill={focused ? color : '#fff'} />
          ),
        }}
      />
    </Tabs>
  );
}
