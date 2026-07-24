import { Stack } from 'expo-router';

export default function KycLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="financial" />
      <Stack.Screen
        name="didit-sdk"
        options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
      />
      <Stack.Screen name="pending" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="profile-gaps" />
    </Stack>
  );
}
