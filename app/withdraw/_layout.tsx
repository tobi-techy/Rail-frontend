import { Stack } from 'expo-router';

export default function WithdrawLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[method]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="select-chain" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="enter-address" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="crypto-send" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="early-withdraw" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="authorize" options={{ animation: 'slide_from_right' }} />
      {/* Currency-specific flows */}
      <Stack.Screen name="ngn" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="crypto" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="usd" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="eur" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="gbp" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
