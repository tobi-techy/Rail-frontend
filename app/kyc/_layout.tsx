import { Stack } from 'expo-router';

export default function KycLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="documents" />
      <Stack.Screen name="disclosures" />
      <Stack.Screen name="profile-gaps" />
    </Stack>
  );
}
