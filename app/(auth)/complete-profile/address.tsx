import React, { useState } from 'react';
import { View, Text, StatusBar, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../../components/ui';
import { InputField, CountryPicker, AuthGradient, StaggeredChild } from '@/components';
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

  const handleNext = () => {
    const nextErrors = {
      street: formData.street.trim() ? '' : 'Street address is required',
      city: formData.city.trim() ? '' : 'City is required',
      state: formData.state.trim() ? '' : 'State is required',
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
    router.push(ROUTES.AUTH.COMPLETE_PROFILE.PHONE as any);
  };

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
              <View className="mb-8 mt-4">
                <Text className="font-subtitle text-[50px] text-black">Address</Text>
                <Text className="mt-2 font-body text-[14px] text-black/60">Where do you live?</Text>
              </View>
            </StaggeredChild>

            <View className="gap-y-2">
              <StaggeredChild index={1}>
                <InputField
                  label="Street Address"
                  placeholder="123 Main St"
                  value={formData.street}
                  onChangeText={(value) => updateField('street', value)}
                  error={errors.street}
                  autoCapitalize="words"
                />
              </StaggeredChild>

              <StaggeredChild index={2}>
                <View className="flex-row gap-x-3">
                  <View className="flex-1">
                    <InputField
                      label="City"
                      placeholder="City"
                      value={formData.city}
                      onChangeText={(value) => updateField('city', value)}
                      error={errors.city}
                      autoCapitalize="words"
                    />
                  </View>
                  <View className="w-28">
                    <InputField
                      label="State"
                      placeholder="State"
                      value={formData.state}
                      onChangeText={(value) => updateField('state', value)}
                      error={errors.state}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              </StaggeredChild>

              <StaggeredChild index={3}>
                <View className="flex-row gap-x-3">
                  <View className="w-32">
                    <InputField
                      label="Postal Code"
                      placeholder="Zip"
                      value={formData.postalCode}
                      onChangeText={(value) => updateField('postalCode', value)}
                      error={errors.postalCode}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View className="flex-1">
                    <CountryPicker
                      label="Country"
                      value={formData.countryName}
                      onSelect={(country) =>
                        setFormData((prev) => ({
                          ...prev,
                          countryName: country.name,
                          countryCode: country.code,
                        }))
                      }
                    />
                  </View>
                </View>
              </StaggeredChild>
            </View>

            <StaggeredChild index={4} delay={80} style={{ marginTop: 'auto' }}>
              <View className="pb-4 pt-8">
                <Button title="Next" onPress={handleNext} />
              </View>
            </StaggeredChild>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AuthGradient>
  );
}
