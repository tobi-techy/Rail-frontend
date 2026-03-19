import React from 'react';
import { Tabs } from 'expo-router';
import { Clock1, Home, Settings } from 'lucide-react-native';
// import { TrendingUp } from 'lucide-react-native'; // market tab

import { TabBar } from '@/components/TabBar';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function TabLayout() {
  return (
    <ErrorBoundary>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: 'InstrumentSans-Bold', fontSize: 32 },
          headerTitleAlign: 'left',
          sceneStyle: { backgroundColor: '#fff' },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Station',
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />
        {/* market tab hidden — href: null removes it from tab bar */}
        {/*<Tabs.Screen  options={{ href: null }} />*/}
        <Tabs.Screen
          name="history"
          options={{
            title: 'Activity',
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
