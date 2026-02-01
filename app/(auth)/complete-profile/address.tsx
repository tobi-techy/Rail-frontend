import React, { useState, useRef } from 'react';
import { View, Text, StatusBar, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../../components/ui';
import { InputField, CountryPicker, AuthGradient, StaggeredChild } from '@/components';
import { useAuthStore } from '@/stores';

export default function Address() {
  const { registrationData, updateRegistrationData } = useAuthStore();
  const [formData, setFormData] = useState({
    street: registrationData.street,
    city: registrationData.city,
    state: registrationData.state,
    postalCode: registrationData.postalCode,
    country: registrationData.country,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cityRef = useRef<TextInput>(null);
  const stateRef = useRef<TextInput>(null);
  const postalRef = useRef<TextInput>(null);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleNext = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.street.trim()) newErrors.street = 'Street address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    updateRegistrationData(formData);
    router.push('/(auth)/complete-profile/phone');
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar barStyle="light-content" />
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-4">
            <StaggeredChild index={0}>
              <View className="mb-8 mt-4">
                <Text className="font-display text-[60px] text-white">Address</Text>
                <Text className="font-body-medium mt-2 text-[14px] text-white/70">
                  Where do you live?
                </Text>
              </View>
            </StaggeredChild>

            <View className="gap-y-2">
              <StaggeredChild index={1}>
                <InputField
                  required
                  label="Street Address"
                  placeholder="123 Main St"
                  value={formData.street}
                  onChangeText={(value) => updateField('street', value)}
                  error={errors.street}
                  variant="dark"
                  returnKeyType="next"
                  onSubmitEditing={() => cityRef.current?.focus()}
                  blurOnSubmit={false}
                  autoCapitalize="words"
                />
              </StaggeredChild>

              <StaggeredChild index={2}>
                <View className="flex-row gap-x-3">
                  <View className="flex-1">
                    <InputField
                      ref={cityRef}
                      required
                      label="City"
                      placeholder="City"
                      value={formData.city}
                      onChangeText={(value) => updateField('city', value)}
                      error={errors.city}
                      variant="dark"
                      returnKeyType="next"
                      onSubmitEditing={() => stateRef.current?.focus()}
                      blurOnSubmit={false}
                      autoCapitalize="words"
                    />
                  </View>
                  <View className="w-28">
                    <InputField
                      ref={stateRef}
                      label="State"
                      placeholder="State"
                      value={formData.state}
                      onChangeText={(value) => updateField('state', value)}
                      error={errors.state}
                      variant="dark"
                      returnKeyType="next"
                      onSubmitEditing={() => postalRef.current?.focus()}
                      blurOnSubmit={false}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              </StaggeredChild>

              <StaggeredChild index={3}>
                <View className="flex-row gap-x-3">
                  <View className="w-32">
                    <InputField
                      ref={postalRef}
                      required
                      label="Postal Code"
                      placeholder="Zip"
                      value={formData.postalCode}
                      onChangeText={(value) => updateField('postalCode', value)}
                      error={errors.postalCode}
                      keyboardType="number-pad"
                      variant="dark"
                      returnKeyType="done"
                    />
                  </View>
                  <View className="flex-1">
                    <CountryPicker
                      required
                      label="Country"
                      value={formData.country}
                      onSelect={(country) => updateField('country', country.name)}
                      error={errors.country}
                      variant="dark"
                    />
                  </View>
                </View>
              </StaggeredChild>
            </View>

            <StaggeredChild index={4} delay={80} style={{ marginTop: 'auto' }}>
              <View className="pb-4 pt-8">
                <Button title="Next" onPress={handleNext} variant="black" />
              </View>
            </StaggeredChild>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AuthGradient>
  );
}
