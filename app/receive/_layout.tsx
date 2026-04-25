import { Stack } from 'expo-router';

export default function ReceiveLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="address" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
