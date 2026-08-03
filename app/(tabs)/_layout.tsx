import React, { useEffect } from 'react';
import { Tabs, router } from 'expo-router';

import { TabBar } from '@/components/TabBar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MiriamConnectSheet } from '@/components/ai/MiriamConnectSheet';
import { usePendingAuthorize } from '@/stores/pendingAuthorize';
import { Clock01Icon, Home01Icon, Settings01Icon, IconComponent } from '@/lib/icons';

export default function TabLayout() {
  // Resume a Miriam approval that arrived via deep link before the user was
  // signed in — now that they're home, reopen the authorize screen.
  const consumeIntent = usePendingAuthorize((s) => s.consumeIntent);
  useEffect(() => {
    const conv = consumeIntent();
    if (conv) {
      // Cast: expo-router regenerates typed routes for authorize on next build.
      setTimeout(() => router.push(`/authorize?conv=${encodeURIComponent(conv)}` as any), 300);
    }
  }, [consumeIntent]);

  return (
    <ErrorBoundary>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#ffffff' },
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: 'Satoshi-Bold', fontSize: 28, width: '100%' },
          headerTitleAlign: 'left',
          headerTitleContainerStyle: { width: '60%' },
          sceneStyle: { backgroundColor: '#ffffff' },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Station',
            tabBarIcon: ({ color, focused }) => (
              <IconComponent
                icon={Home01Icon}
                size={24}
                color={color}
                weight={focused ? 'fill' : 'regular'}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'Activity',
            tabBarIcon: ({ color, focused }) => (
              <IconComponent
                icon={Clock01Icon}
                size={24}
                color={color}
                weight={focused ? 'fill' : 'regular'}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, focused }) => (
              <IconComponent
                icon={Settings01Icon}
                size={24}
                color={color}
                weight={focused ? 'fill' : 'regular'}
              />
            ),
          }}
        />
      </Tabs>
      <MiriamConnectSheet />
    </ErrorBoundary>
  );
}
