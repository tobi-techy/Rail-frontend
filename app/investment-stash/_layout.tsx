import { Stack } from 'expo-router';

export default function InvestmentStashLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: '',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#fff' },
        contentStyle: { backgroundColor: '#fff' },
        animation: 'fade',
        gestureEnabled: true,
      }}
    />
  );
}
