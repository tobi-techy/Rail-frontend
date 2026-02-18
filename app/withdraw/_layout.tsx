import { Stack } from 'expo-router';

export default function WithdrawLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_bottom' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[method]" />
    </Stack>
  );
}
