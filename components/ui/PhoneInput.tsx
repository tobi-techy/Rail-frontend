import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Text, TextInputProps, TouchableOpacity, View } from 'react-native';
import type { TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InputField } from '@/components/atoms/InputField';

interface CountryCode {
  code: string;
  country: string;
  flag: string;
  dialCode: string;
}

interface PhoneInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (phone: string, countryCode: string, formattedPhone: string) => void;
  error?: string;
  label?: string;
  defaultCountry?: string;
  containerClassName?: string;
  showCountryPicker?: boolean;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: 'CA', country: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  { code: 'US', country: 'United States', flag: '🇺🇸', dialCode: '+1' },
  { code: 'GB', country: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  { code: 'AU', country: 'Australia', flag: '🇦🇺', dialCode: '+61' },
  { code: 'DE', country: 'Germany', flag: '🇩🇪', dialCode: '+49' },
  { code: 'FR', country: 'France', flag: '🇫🇷', dialCode: '+33' },
  { code: 'IN', country: 'India', flag: '🇮🇳', dialCode: '+91' },
  { code: 'JP', country: 'Japan', flag: '🇯🇵', dialCode: '+81' },
  { code: 'CN', country: 'China', flag: '🇨🇳', dialCode: '+86' },
];

const formatPhoneNumber = (phone: string, country: CountryCode) => {
  const cleaned = phone.replace(/\D/g, '');
  if (country.code === 'CA' || country.code === 'US') {
    if (cleaned.length >= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
    if (cleaned.length >= 3) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    }
  }
  return cleaned;
};

export const PhoneInput = forwardRef<TextInput, PhoneInputProps>(
  (
    {
      value,
      onChangeText,
      error,
      label,
      defaultCountry = 'CA',
      containerClassName = '',
      showCountryPicker = true,
      ...props
    },
    ref
  ) => {
    const inputRef = useRef<TextInput>(null);
    const [showPicker, setShowPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
      COUNTRY_CODES.find((country) => country.code === defaultCountry) ?? COUNTRY_CODES[0]
    );

    useImperativeHandle(ref, () => inputRef.current as TextInput);

    const filteredCountries = useMemo(
      () =>
        COUNTRY_CODES.filter(
          (country) =>
            country.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
            country.dialCode.includes(searchQuery)
        ),
      [searchQuery]
    );

    const formattedValue = formatPhoneNumber(value, selectedCountry);

    const handleTextChange = (text: string) => {
      const cleaned = text.replace(/\D/g, '');
      const formatted = formatPhoneNumber(cleaned, selectedCountry);
      onChangeText(cleaned, selectedCountry.dialCode, formatted);
    };

    const handleCountrySelect = (country: CountryCode) => {
      setSelectedCountry(country);
      setShowPicker(false);
      setSearchQuery('');
      const formatted = formatPhoneNumber(value, country);
      onChangeText(value, country.dialCode, formatted);
      setTimeout(() => inputRef.current?.focus(), 100);
    };

    return (
      <View className={containerClassName}>
        <InputField
          ref={inputRef}
          label={label}
          value={formattedValue}
          onChangeText={handleTextChange}
          placeholder="Phone number"
          type="phone"
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          error={error}
          leftAccessory={
            showCountryPicker ? (
              <TouchableOpacity
                onPress={() => setShowPicker(true)}
                className="min-h-[44px] min-w-[44px] flex-row items-center pr-3"
                accessibilityRole="button"
                accessibilityLabel={`Country code ${selectedCountry.country} ${selectedCountry.dialCode}`}>
                <Text className="mr-1 text-[16px]">{selectedCountry.flag}</Text>
                <Text className="mr-1 font-body text-body text-text-primary">
                  {selectedCountry.dialCode}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#6B7280" />
              </TouchableOpacity>
            ) : undefined
          }
          rightAccessory={
            value.length > 0 ? (
              <TouchableOpacity
                onPress={() => onChangeText('', selectedCountry.dialCode, '')}
                className="min-h-[44px] min-w-[44px] items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Clear phone number">
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ) : undefined
          }
          {...props}
        />

        <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet">
          <View className="flex-1 bg-background-main">
            <View className="border-b border-surface px-5 py-4">
              <View className="flex-row items-center justify-between">
                <Text className="font-subtitle text-xl text-text-primary">Country code</Text>
                <TouchableOpacity
                  onPress={() => setShowPicker(false)}
                  className="min-h-[44px] min-w-[44px] items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel="Close country picker">
                  <Ionicons name="close" size={22} color="#111111" />
                </TouchableOpacity>
              </View>
              <Text className="mt-1 font-body text-body text-text-secondary">
                Select your mobile number from our list of supported country codes.
              </Text>
            </View>

            <View className="px-5 py-4">
              <InputField
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search countries"
                icon="search-outline"
                density="compact"
                inputWrapperClassName="rounded-full bg-surface border-surface"
              />
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleCountrySelect(item)}
                  className={`flex-row items-center border-b border-surface px-5 py-3 ${
                    selectedCountry.code === item.code ? 'bg-surface-secondary' : ''
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.country}, ${item.dialCode}`}
                  accessibilityState={{ selected: selectedCountry.code === item.code }}>
                  <Text className="mr-3 text-2xl">{item.flag}</Text>
                  <Text className="flex-1 font-body text-body text-text-primary">
                    {item.country}
                  </Text>
                  <Text className="font-subtitle text-body text-text-primary">{item.dialCode}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Modal>
      </View>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
