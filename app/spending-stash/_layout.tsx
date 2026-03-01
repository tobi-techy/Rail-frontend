import { Stack } from 'expo-router';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function SpendingStashLayout() {
  return (
    <ErrorBoundary>
      <Stack
        screenOptions={{
          headerShown: false,
          headerTitle: '',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#000000' },
          animation: 'fade',
          gestureEnabled: true,
          contentStyle: { backgroundColor: '#000000' },
        }}
      />
    </ErrorBoundary>
  );
}
