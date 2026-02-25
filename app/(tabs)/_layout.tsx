import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Clock1, Home, Settings } from 'lucide-react-native';

import { TabBar } from '@/components/TabBar';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function TabLayout() {
  return (
    <ErrorBoundary>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: Platform.OS === 'android' ? '#FF2E01' : '#fff' },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Home size={24} color={color} fill={focused ? color : '#999'} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color, focused }) => (
              <Clock1 size={24} color={color} fill={focused ? color : '#999'} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, focused }) => (
              <Settings size={24} color={color} fill={focused ? color : '#999'} />
            ),
          }}
        />
      </Tabs>
    </ErrorBoundary>
  );
}
