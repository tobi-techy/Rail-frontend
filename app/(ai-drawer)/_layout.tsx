import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { MiriamDrawerContent } from '@/components/ai/MiriamDrawerContent';
import { Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function AIDrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <MiriamDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: 'right',
        drawerType: 'front',
        drawerStyle: { width: SCREEN_WIDTH },
        swipeEnabled: true,
        swipeEdgeWidth: 50,
      }}>
      <Drawer.Screen name="ai-chat" options={{ drawerLabel: 'Chat' }} />
    </Drawer>
  );
}
