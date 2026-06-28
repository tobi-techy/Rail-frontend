import { Stack } from 'expo-router';

export default function CryptoLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="confirm" />
    </Stack>
  );
}
