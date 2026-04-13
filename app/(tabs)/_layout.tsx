import React from 'react';
import { Tabs } from 'expo-router';

import { TabBar } from '@/components/TabBar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Clock01Icon, Home01Icon, Settings01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

export default function TabLayout() {
  return (
    <ErrorBoundary>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: 'SFProDisplay-Bold', fontSize: 28 },
          headerTitleAlign: 'left',
          sceneStyle: { backgroundColor: '#fff' },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Station',
            tabBarIcon: ({ color }) => <HugeiconsIcon icon={Home01Icon} size={24} color={color} />,
          }}
        />
        {/* market tab hidden — href: null removes it from tab bar */}
        {/*<Tabs.Screen  options={{ href: null }} />*/}
        <Tabs.Screen
          name="history"
          options={{
            title: 'Activity',
            tabBarIcon: ({ color }) => <HugeiconsIcon icon={Clock01Icon} size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <HugeiconsIcon icon={Settings01Icon} size={24} color={color} />,
          }}
        />
      </Tabs>
    </ErrorBoundary>
  );
}
