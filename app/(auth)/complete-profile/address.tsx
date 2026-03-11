import React, { useState } from 'react';
import { View, Text, StatusBar, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../../components/ui';
import {
  InputField,
  CountryPicker,
  AuthGradient,
  StaggeredChild,
  StatePicker,
  hasSubdivisions,
  getSubdivisionLabel,
} from '@/components';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/authStore';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';

export default function Address() {
  const registrationData = useAuthStore((state) => state.registrationData);
  const updateRegistrationData = useAuthStore((state) => state.updateRegistrationData);
  const [formData, setFormData] = useState({
    street: registrationData.street || '',
    city: registrationData.city || '',
    state: registrationData.state || '',
    postalCode: registrationData.postalCode || '',
    countryName: registrationData.country || '',
    countryCode: registrationData.country || '',
  });
  const [errors, setErrors] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
  });
  const { showWarning } = useFeedbackPopup();

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field in errors) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleCountrySelect = (country: { code: string; name: string }) => {
    setFormData((prev) => ({
      ...prev,
      countryName: country.name,
      countryCode: country.code,
      state: '', // Reset state when country changes
    }));
  };

  const handleStateSelect = (subdivision: { code: string; name: string }) => {
    // Send full state name to backend (Bridge requires full name, not code)
    setFormData((prev) => ({ ...prev, state: subdivision.name }));
    setErrors((prev) => ({ ...prev, state: '' }));
  };

  const handleNext = () => {
    const nextErrors = {
      street: formData.street.trim() ? '' : 'Street address is required',
      city: formData.city.trim() ? '' : 'City is required',
      state: formData.state.trim()
        ? ''
        : `${getSubdivisionLabel(formData.countryCode)} is required`,
      postalCode: formData.postalCode.trim() ? '' : 'Postal code is required',
    };

    if (
      nextErrors.street ||
      nextErrors.city ||
      nextErrors.state ||
      nextErrors.postalCode ||
      !formData.countryCode
    ) {
      setErrors(nextErrors);
      showWarning('Missing Information', 'Please complete all address fields before continuing.');
      return;
    }

    setErrors({ street: '', city: '', state: '', postalCode: '' });
    updateRegistrationData({
      street: formData.street.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      postalCode: formData.postalCode.trim(),
      country: formData.countryCode,
    });
    router.push(ROUTES.AUTH.COMPLETE_PROFILE.PHONE as never);
  };

  const showStatePicker = hasSubdivisions(formData.countryCode);
  const stateLabel = getSubdivisionLabel(formData.countryCode);

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={Platform.OS === 'android'}
        />
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="flex-1 px-6 pt-4">
            <StaggeredChild index={0}>
              <View className="mb-6 mt-4">
                <Text className="font-headline-2 text-auth-title leading-[1.1] text-black">
                  Your details
                </Text>
                <Text className="mt-2 font-body text-[14px] text-black/60">
                  Enter your full <Text className="font-semibold">residential</Text> address.
                </Text>
              </View>
            </StaggeredChild>

            <View className="gap-y-3">
              <StaggeredChild index={4}>
                <CountryPicker
                  label="Country"
                  value={formData.countryName}
                  onSelect={handleCountrySelect}
                />
              </StaggeredChild>

              <StaggeredChild index={1}>
                <InputField
                  label="Street Address"
                  placeholder="123 Main St, Apt 4B"
                  value={formData.street}
                  onChangeText={(value) => updateField('street', value)}
                  error={errors.street}
                  autoCapitalize="words"
                />
              </StaggeredChild>

              <StaggeredChild index={2}>
                <InputField
                  label="City"
                  placeholder="City"
                  value={formData.city}
                  onChangeText={(value) => updateField('city', value)}
                  error={errors.city}
                  autoCapitalize="words"
                />
              </StaggeredChild>

              <StaggeredChild index={3}>
                <View className="flex-row gap-x-3">
                  <View className="flex-1">
                    {showStatePicker ? (
                      <StatePicker
                        label={stateLabel}
                        value={formData.state}
                        onSelect={handleStateSelect}
                        error={errors.state}
                        countryCode={formData.countryCode}
                      />
                    ) : (
                      <InputField
                        label={stateLabel}
                        placeholder={stateLabel}
                        value={formData.state}
                        onChangeText={(value) => updateField('state', value)}
                        error={errors.state}
                        autoCapitalize="words"
                      />
                    )}
                  </View>
                  <View className="w-28">
                    <InputField
                      label="Postal Code"
                      placeholder="Zip"
                      value={formData.postalCode}
                      onChangeText={(value) => updateField('postalCode', value)}
                      error={errors.postalCode}
                      keyboardType="default"
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              </StaggeredChild>
            </View>

            <StaggeredChild index={5} delay={80} style={{ marginTop: 'auto' }}>
              <View className="pb-4 pt-6">
                <Button title="Continue" onPress={handleNext} />
              </View>
            </StaggeredChild>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AuthGradient>
  );
}
