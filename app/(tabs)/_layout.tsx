import React from 'react';
import { Tabs } from 'expo-router';
import { Clock1, Home, Settings } from 'lucide-react-native';

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
            <Home size={24} color={color} fill={focused ? color : '#000'} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <Clock1 size={24} color={color} fill={focused ? color : '#000'} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Settings size={24} color={color} fill={focused ? color : '#000'} />
          ),
        }}
      />
    </Tabs>
  );
}
