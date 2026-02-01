import React, { useState } from 'react';
import { View, Text, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../../components/ui';
import { InputField, CountryPicker, AuthGradient, StaggeredChild } from '@/components';

export default function Address() {
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
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
          showsVerticalScrollIndicator={false}>
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
                  label="Street Address"
                  placeholder="123 Main St"
                  value={formData.street}
                  onChangeText={(value) => updateField('street', value)}
                  variant="dark"
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
                      variant="dark"
                      autoCapitalize="words"
                    />
                  </View>
                  <View className="w-28">
                    <InputField
                      label="State"
                      placeholder="State"
                      value={formData.state}
                      onChangeText={(value) => updateField('state', value)}
                      variant="dark"
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
                      keyboardType="number-pad"
                      variant="dark"
                    />
                  </View>
                  <View className="flex-1">
                    <CountryPicker
                      label="Country"
                      value={formData.country}
                      onSelect={(country) => updateField('country', country.name)}
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
