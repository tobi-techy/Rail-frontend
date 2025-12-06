import React from 'react';
import { Tabs } from 'expo-router';
import { CreditCard, Home, User, DollarSign } from 'lucide-react-native';

import { GlassTabBar } from '@/components/navigation/GlassTabBar';

export default function _layout() {
  return (
    <Tabs
      // tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        //  tabBarStyle: { display: 'none' }, // Hide the default tab bar
        tabBarInactiveTintColor: '#888',
        tabBarActiveTintColor: '#2C2C2C',
        sceneStyle: { backgroundColor: '#fff' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home strokeWidth={0.5} size={24} fill={color} />,
        }}
      />
      <Tabs.Screen
        name="invest"
        options={{
          title: 'Invest',
          tabBarIcon: ({ color }) => <DollarSign strokeWidth={0.5} size={24} fill={color} />,
        }}
      />
      <Tabs.Screen
        name="card"
        options={{
          title: 'Card',
          tabBarIcon: ({ color }) => <CreditCard strokeWidth={0.5} size={24} fill={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User strokeWidth={0.5} size={24} fill={color} />,
        }}
      />
    </Tabs>
  );
}
