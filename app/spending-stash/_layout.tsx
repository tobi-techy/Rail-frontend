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
          headerStyle: { backgroundColor: '#fff' },
          contentStyle: { backgroundColor: '#fff' },
          animation: 'fade',
          gestureEnabled: true,
        }}
      />
    </ErrorBoundary>
  );
}
