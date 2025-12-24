import React from 'react';
import { Tabs } from 'expo-router';
import { CreditCard, Home, PieChart } from 'lucide-react-native';

import { TabBar } from '@/components/TabBar';

export default function TabLayout() {
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
            <Home size={24} color={color} fill={focused ? '#FF5A00' : 'black'} />
          ),
        }}
      />
      <Tabs.Screen
        name="invest"
        options={{
          title: 'Invest',
          tabBarIcon: ({ color, focused }) => (
            <PieChart size={24} color={color} fill={focused ? color : 'black'} />
          ),
        }}
      />
      <Tabs.Screen
        name="card"
        options={{
          title: 'Card',
          tabBarIcon: ({ color, focused }) => (
            <CreditCard size={24} color={color} fill={focused ? color : 'black'} />
          ),
        }}
      />
    </Tabs>
  );
}
