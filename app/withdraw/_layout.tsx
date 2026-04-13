import { Stack } from 'expo-router';

export default function WithdrawLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="[method]" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="destination" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="details" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="confirm" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
