import React from 'react';
import { Tabs } from 'expo-router';
import { Clock1, Home, Settings, TrendingUp } from 'lucide-react-native';

import { TabBar } from '@/components/TabBar';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function TabLayout() {
  return (
    <ErrorBoundary>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: '#fff' },
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />
        {/* <Tabs.Screen
          name="market"
          options={{
            title: 'Market',
            tabBarIcon: ({ color }) => <TrendingUp size={24} color={color} />,
          }}
        /> */}
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color }) => <Clock1 size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
          }}
        />
      </Tabs>
    </ErrorBoundary>
  );
}
