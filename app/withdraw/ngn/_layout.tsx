import { Stack } from 'expo-router';

export default function NgnLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="recipients" />
      <Stack.Screen name="select-bank" options={{ animationDuration: 200 }} />
      <Stack.Screen name="enter-account" options={{ animationDuration: 200 }} />
      <Stack.Screen name="confirm" />
    </Stack>
  );
}
