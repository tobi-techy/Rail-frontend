import React from 'react';
import { Tabs } from 'expo-router';

import { TabBar } from '@/components/TabBar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Clock01Icon, Home01Icon, Settings01Icon, IconComponent } from '@/lib/icons';

export default function TabLayout() {
  return (
    <ErrorBoundary>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#fbfaf9' },
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: 'SFProDisplay-Bold', fontSize: 28, width: '100%' },
          headerTitleAlign: 'left',
          headerTitleContainerStyle: { width: '60%' },
          sceneStyle: { backgroundColor: '#fbfaf9' },
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
    </ErrorBoundary>
  );
}
