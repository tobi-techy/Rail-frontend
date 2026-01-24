import React, { useState } from 'react';
import { View, Text, StatusBar, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../../components/ui';
import { InputField, CountryPicker } from '@/components';
import { useAuthStore } from '@/stores';
import { Ionicons } from '@/components/atoms/SafeIonicons';

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

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
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
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-4">
          <Pressable onPress={() => router.back()} className="mb-4">
            <Ionicons name="arrow-back" size={24} color="black" />
          </Pressable>
          <View className="mb-8">
            <Text className="font-display text-[60px] text-gray-900">Address</Text>
            <Text className="font-body-medium mt-2 text-[14px] text-gray-600">
              Where do you live?
            </Text>
          </View>

          <View className="gap-y-4">
            <InputField
              required
              label="Street Address"
              placeholder="123 Main St"
              value={formData.street}
              onChangeText={(value) => updateField('street', value)}
              error={errors.street}
            />

            <View className="flex-row gap-x-4">
              <View className="flex-1">
                <InputField
                  required
                  label="City"
                  placeholder="City"
                  value={formData.city}
                  onChangeText={(value) => updateField('city', value)}
                  error={errors.city}
                />
              </View>
              <View className="flex-1">
                <InputField
                  label="State"
                  placeholder="State"
                  value={formData.state}
                  onChangeText={(value) => updateField('state', value)}
                  error={errors.state}
                />
              </View>
            </View>

            <View className="flex-row gap-x-4">
              <View className="flex-1">
                <InputField
                  required
                  label="Postal Code"
                  placeholder="Zip Code"
                  value={formData.postalCode}
                  onChangeText={(value) => updateField('postalCode', value)}
                  error={errors.postalCode}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <CountryPicker
              required
              label="Country"
              value={formData.country} // Assuming CountryPicker takes name or code. Let's assume it takes name based on previous review, but we stored code in old component? Wait, previous code used 2 letter code. The CountryPicker component uses full Name as value prop according to 'selectedCountry.name === value'.
              // We should probably adapt to what CountryPicker expects.
              // Let's store the Name for UI but mapped to code if needed.
              // Actually RegistrationData has country string. Let's store Name for now to match UI or refactor CountryPicker.
              // Given the `CountryPicker` implementation: `const selectedCountry = COUNTRIES.find(country => country.name === value);`
              // It expects `value` to be the Name (e.g. "United States").
              // So we will store the name in our state for this flow.
              onSelect={(country) => updateField('country', country.name)}
              error={errors.country}
            />
          </View>

          <View className="mt-8">
            <Button title="Next" onPress={handleNext} className="rounded-full font-body" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
