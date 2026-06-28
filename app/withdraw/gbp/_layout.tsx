import { Stack } from 'expo-router';

export default function GbpLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="recipients" />
      <Stack.Screen name="new-recipient" />
      <Stack.Screen name="confirm" />
    </Stack>
  );
}
