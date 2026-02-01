import React, { ReactNode } from 'react';
import { View, Text, StatusBar, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthGradient, StaggeredChild } from '@/components';
import { Button } from '@/components/ui';

interface AuthScreenProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  buttonTitle?: string;
  buttonDisabled?: boolean;
  onButtonPress?: () => void;
  scrollable?: boolean;
  showButton?: boolean;
}

export const AuthScreen = ({
  title,
  subtitle,
  children,
  buttonTitle = 'Next',
  buttonDisabled = false,
  onButtonPress,
  scrollable = false,
  showButton = true,
}: AuthScreenProps) => {
  const content = (
    <View className="flex-1 px-6 pt-4">
      <StaggeredChild index={0}>
        <View className="mb-8 mt-4">
          <Text className="font-display text-[60px] leading-[1.05] text-white">{title}</Text>
          {subtitle && (
            <Text className="font-body-medium mt-2 text-[14px] text-white/70">{subtitle}</Text>
          )}
        </View>
      </StaggeredChild>

      {children}

      {showButton && onButtonPress && (
        <StaggeredChild index={10} delay={80} style={{ marginTop: 'auto' }}>
          <View className="pb-4">
            <Button
              title={buttonTitle}
              onPress={onButtonPress}
              variant="black"
              disabled={buttonDisabled}
            />
          </View>
        </StaggeredChild>
      )}
    </View>
  );

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar barStyle="light-content" />
        {scrollable ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1">
            <ScrollView
              className="flex-1"
              contentContainerClassName="flex-grow"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {content}
            </ScrollView>
          </KeyboardAvoidingView>
        ) : (
          content
        )}
      </SafeAreaView>
    </AuthGradient>
  );
};
