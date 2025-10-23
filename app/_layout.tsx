import React, { useState, useEffect, useCallback } from 'react';
import { router, Stack, useSegments, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from '@/hooks/useFonts';
import { SplashScreen as CustomSplashScreen } from '@/components/SplashScreen';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import '../global.css';
import { Text, TouchableOpacity, View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from '@/api/queryClient';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keep the native splash screen visible while we fetch resources
SplashScreen.hide()
// SplashScreen.hideAsync();


/**
 * Auth navigation component that handles routing based on auth state
 */
function useProtectedRoute() {
  const segments = useSegments();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const onboardingStatus = useAuthStore((state) => state.onboardingStatus);
  const pendingVerificationEmail = useAuthStore((state) => state.pendingVerificationEmail);
  const [hasNavigated, setHasNavigated] = React.useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = React.useState(false);
  const [isReady, setIsReady] = React.useState(false);

  // Check if user has seen welcome screen before
  useEffect(() => {
    const checkWelcomeStatus = async () => {
      try {
        const welcomed = await AsyncStorage.getItem('hasSeenWelcome');
        setHasSeenWelcome(welcomed === 'true');
      } catch (error) {
        console.error('Error checking welcome status:', error);
      } finally {
        setIsReady(true);
      }
    };
    checkWelcomeStatus();
  }, []);

  useEffect(() => {
    // Wait until we've checked welcome status
    if (!isReady || hasNavigated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const isOnWelcomeScreen = pathname === '/';
    const isOnLoginPasscode = pathname === '/(auth)/login-passcode';
    const isOnVerifyEmail = pathname === '/(auth)/verify-email';
    const isOnCreatePasscode = pathname === '/(auth)/create-passcode';
    const isOnConfirmPasscode = pathname === '/(auth)/confirm-passcode';

    // Authenticated user with valid session (already logged in with email/password)
    if (isAuthenticated && user && accessToken) {
      // Check onboarding progress from user object
      const userOnboardingStatus = user.onboardingStatus || onboardingStatus;
      const hasUserPasscode = user.hasPasscode;
      
      // Critical: Don't interrupt active auth flows - let user complete them
      if (isOnLoginPasscode || isOnVerifyEmail || isOnCreatePasscode || isOnConfirmPasscode) {
        return;
      }
      
      // User completed onboarding and in tabs - let them stay
      if (userOnboardingStatus === 'completed' && inTabsGroup) {
        return;
      }
      
      // User completed onboarding with passcode - go to main app
      if (userOnboardingStatus === 'completed' && hasUserPasscode && !inTabsGroup) {
        setHasNavigated(true);
        router.replace('/(tabs)');
      }
      // User completed onboarding without passcode - still go to main app
      else if (userOnboardingStatus === 'completed' && !hasUserPasscode && !inTabsGroup) {
        setHasNavigated(true);
        router.replace('/(tabs)');
      }
      // User logged in but on welcome screen - redirect based on status
      else if (isOnWelcomeScreen) {
        setHasNavigated(true);
        if (userOnboardingStatus === 'completed') {
          router.replace('/(tabs)');
        } else if (user.emailVerified && !hasUserPasscode) {
          router.replace('/(auth)/create-passcode');
        } else if (!user.emailVerified) {
          router.replace('/(auth)/verify-email');
        }
      }
      // User needs to create passcode after verification (but not during flow)
      else if (user.emailVerified && !hasUserPasscode && !inAuthGroup) {
        setHasNavigated(true);
        router.replace('/(auth)/create-passcode');
      }
    }
    // User has stored credentials but not authenticated (needs passcode verification)
    else if (!isAuthenticated && user && user.hasPasscode) {
      // Returning user with passcode - send to login-passcode screen
      if (!isOnLoginPasscode && !inAuthGroup) {
        setHasNavigated(true);
        router.replace('/(auth)/login-passcode');
      } else if (inAuthGroup && !isOnLoginPasscode) {
        // If in auth group but not on login-passcode, allow them to continue (e.g., signin screen)
        return;
      }
    }
    // User awaiting email verification (has pending email but not authenticated)
    else if (!isAuthenticated && !user && pendingVerificationEmail) {
      // User is in the middle of signup flow - keep them on verify-email screen
      if (isOnVerifyEmail) {
        return;
      }
      // If they navigated away from verify-email, bring them back
      if (!isOnVerifyEmail && !isOnWelcomeScreen) {
        setHasNavigated(true);
        router.replace('/(auth)/verify-email');
      }
    }
    // No authentication - handle first-time vs returning
    else if (!isAuthenticated && !user) {
      // If user has seen welcome and is in auth flow, let them continue
      if (hasSeenWelcome && inAuthGroup) {
        return;
      }
      // If user hasn't seen welcome and is not on welcome screen, go to welcome
      if (!hasSeenWelcome && !isOnWelcomeScreen) {
        setHasNavigated(true);
        router.replace('/');
      }
      // If in protected areas without auth, redirect to welcome
      if (inTabsGroup || (!inAuthGroup && !isOnWelcomeScreen)) {
        setHasNavigated(true);
        router.replace('/');
      }
    }
  }, [user, isAuthenticated, accessToken, onboardingStatus, pendingVerificationEmail, pathname, segments, hasNavigated, hasSeenWelcome, isReady]);
}

const App  = () => {
  useProtectedRoute();
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function Layout() {
  const { fontsLoaded, error, retryLoading } = useFonts();
  const [isAppReady, setIsAppReady] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(true);


  // Prepare the app
  useEffect(() => {
    async function prepare() {
      try {
        // Hide the native splash screen immediately
        await SplashScreen.hideAsync();
        
        // Wait for fonts to load
        if (fontsLoaded && !error) {
          // Add a small delay to ensure everything is ready
          await new Promise(resolve => setTimeout(resolve, 1500));
          setIsAppReady(true);
        }
      } catch (e) {
        console.warn('Error preparing app:', e);
        // Still mark as ready even if there's an error
        setIsAppReady(true);
      }
    }

    prepare();
  }, [fontsLoaded, error]);

  const handleSplashComplete = useCallback(() => {
    setShowCustomSplash(false);
  }, []);

  // Show custom splash screen while loading
  if (showCustomSplash) {
    return (
      <CustomSplashScreen
        isReady={isAppReady}
        onAnimationComplete={handleSplashComplete}
      />
    );
  }

  // Show error state if fonts failed to load
  if (error) {
    return (
      <Stack
        screenOptions={{
          headerShown: false,
        }}>
       <Stack.Screen name="onboarding" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      </Stack>
    );
  }

  // Fonts are loaded successfully, render the app
  return (
    <KeyboardProvider>
      <View className='flex-1 bg-white'>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <App />
          </SafeAreaProvider>
        </QueryClientProvider>
      </View>
    </KeyboardProvider>
  );
}
