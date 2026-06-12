import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Modal, FlatList, Keyboard } from 'react-native';
import type { TextInput } from 'react-native';
import { Ionicons } from './SafeIonicons';
import { InputField } from './InputField';

interface CountryCode {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  maxLength: number; // max digits after dial code
}

interface PhoneNumberInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText: (phoneNumber: string) => void;
  onCountryChange?: (country: CountryCode) => void;
  error?: string;
  required?: boolean;
  defaultCountry?: string;
  variant?: 'light' | 'dark' | 'blended';
}

const COUNTRY_CODES: CountryCode[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', maxLength: 10 },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', maxLength: 10 },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', maxLength: 10 },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61', maxLength: 9 },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49', maxLength: 11 },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', maxLength: 9 },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39', maxLength: 10 },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34', maxLength: 9 },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31', maxLength: 9 },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', dialCode: '+46', maxLength: 9 },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', dialCode: '+47', maxLength: 8 },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', dialCode: '+45', maxLength: 8 },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', dialCode: '+358', maxLength: 9 },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', dialCode: '+41', maxLength: 9 },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', dialCode: '+43', maxLength: 10 },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', dialCode: '+32', maxLength: 9 },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', dialCode: '+353', maxLength: 9 },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351', maxLength: 9 },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', dialCode: '+30', maxLength: 10 },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', dialCode: '+48', maxLength: 9 },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', dialCode: '+420', maxLength: 9 },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', dialCode: '+36', maxLength: 9 },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰', dialCode: '+421', maxLength: 9 },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮', dialCode: '+386', maxLength: 8 },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', dialCode: '+385', maxLength: 9 },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', dialCode: '+40', maxLength: 9 },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', dialCode: '+359', maxLength: 9 },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹', dialCode: '+370', maxLength: 8 },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻', dialCode: '+371', maxLength: 8 },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪', dialCode: '+372', maxLength: 8 },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', dialCode: '+352', maxLength: 9 },
  { code: 'MT', name: 'Malta', flag: '🇲🇹', dialCode: '+356', maxLength: 8 },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾', dialCode: '+357', maxLength: 8 },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81', maxLength: 10 },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', dialCode: '+82', maxLength: 10 },
  { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86', maxLength: 11 },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91', maxLength: 10 },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65', maxLength: 8 },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', dialCode: '+852', maxLength: 8 },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', dialCode: '+886', maxLength: 9 },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', dialCode: '+60', maxLength: 10 },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', dialCode: '+66', maxLength: 9 },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', dialCode: '+62', maxLength: 11 },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', dialCode: '+63', maxLength: 10 },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', dialCode: '+84', maxLength: 10 },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55', maxLength: 11 },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52', maxLength: 10 },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54', maxLength: 10 },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', dialCode: '+56', maxLength: 9 },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', dialCode: '+57', maxLength: 10 },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', dialCode: '+51', maxLength: 9 },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾', dialCode: '+598', maxLength: 8 },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27', maxLength: 9 },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234', maxLength: 10 },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254', maxLength: 9 },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20', maxLength: 10 },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', dialCode: '+212', maxLength: 9 },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', dialCode: '+972', maxLength: 9 },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971', maxLength: 9 },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966', maxLength: 9 },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', dialCode: '+90', maxLength: 10 },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', dialCode: '+7', maxLength: 10 },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', dialCode: '+380', maxLength: 9 },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', dialCode: '+64', maxLength: 9 },
];

// Format phone number based on country
const formatPhoneNumber = (digits: string, countryCode: string): string => {
  if (!digits) return '';

  switch (countryCode) {
    case 'US':
    case 'CA':
      // (XXX) XXX-XXXX
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    case 'GB':
      // XXXXX XXXXXX
      if (digits.length <= 5) return digits;
      return `${digits.slice(0, 5)} ${digits.slice(5, 11)}`;
    case 'DE':
      // XXXX XXXXXXX
      if (digits.length <= 4) return digits;
      return `${digits.slice(0, 4)} ${digits.slice(4, 11)}`;
    case 'FR':
    case 'ES':
    case 'IT':
      // XXX XXX XXX
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
    case 'NG':
      // XXX XXX XXXX
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
    default:
      // Default: XXX XXX XXXX
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
};

export function PhoneNumberInput({
  label,
  placeholder = 'Enter phone number',
  value = '',
  onChangeText,
  onCountryChange,
  error,
  required = false,
  defaultCountry = 'US',
  variant = 'blended',
}: PhoneNumberInputProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const isDark = variant === 'dark';
  const hasError = !!error;

  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    COUNTRY_CODES.find((country) => country.code === defaultCountry) || COUNTRY_CODES[0]
  );

  const filteredCountries = COUNTRY_CODES.filter(
    (country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.dialCode.includes(searchQuery)
  );

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setIsModalVisible(false);
    setSearchQuery('');
    onCountryChange?.(country);
    onChangeText(''); // Reset number when country changes
  };

  const handlePhoneNumberChange = (text: string) => {
    // Strip all non-digits
    const digits = text.replace(/\D/g, '');

    // Limit to country's max length
    const limitedDigits = digits.slice(0, selectedCountry.maxLength);

    // Format and update
    const formatted = formatPhoneNumber(limitedDigits, selectedCountry.code);
    onChangeText(formatted);
  };

  const renderCountryItem = ({ item }: { item: CountryCode }) => (
    <Pressable
      onPress={() => handleCountrySelect(item)}
      className="flex-row items-center border-b border-fog/40 px-5 py-3">
      <Text className="mr-3 text-2xl">{item.flag}</Text>
      <View className="flex-1">
        <Text className="font-body text-body text-text-primary">{item.name}</Text>
        <Text className="font-caption text-caption text-text-secondary">{item.dialCode}</Text>
      </View>
    </Pressable>
  );

  return (
    <View className={isDark ? 'mb-2' : 'mb-4'}>
      <InputField
        ref={inputRef}
        label={label}
        required={required}
        value={value}
        onChangeText={handlePhoneNumberChange}
        placeholder={placeholder}
        keyboardType="number-pad"
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        maxLength={selectedCountry.maxLength + 4}
        variant={variant}
        error={error}
        leftAccessory={
          <Pressable
            onPress={() => setIsModalVisible(true)}
            className={`mr-1 min-h-[44px] min-w-[44px] flex-row items-center border-r pr-3 ${
              isDark ? 'border-white/30' : 'border-fog'
            }`}>
            <Text className="mr-2 text-lg">{selectedCountry.flag}</Text>
            <Text
              className={`mr-1 font-body text-body ${isDark ? 'text-white' : 'text-text-primary'}`}>
              {selectedCountry.dialCode}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={
                hasError ? '#ff2b3a' : isDark ? '#FFFFFF' : isModalVisible ? '#343433' : '#848281'
              }
            />
          </Pressable>
        }
        rightAccessory={
          value.length > 0 ? (
            <Pressable
              onPress={() => {
                onChangeText('');
                Keyboard.dismiss();
              }}
              className="min-h-[44px] min-w-[44px] items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Clear phone number">
              <Ionicons
                name="close-circle"
                size={20}
                color={isDark ? 'rgba(255,255,255,0.6)' : '#A0A0A0'}
              />
            </Pressable>
          ) : undefined
        }
      />

      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-parchment-card">
          <View className="flex-row items-center justify-between border-b border-fog/40 px-5 py-4">
            <Text className="font-subtitle text-[30px] text-text-primary">Select Country Code</Text>
            <Pressable onPress={() => setIsModalVisible(false)} className="p-2">
              <Ionicons name="close" size={24} color="#000000" />
            </Pressable>
          </View>

          <View className="border-b border-fog/40 px-5 py-3">
            <InputField
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search countries or codes..."
              icon="search-outline"
              density="compact"
              inputWrapperClassName="rounded-2xl border-transparent bg-neutral-100"
            />
          </View>

          <FlatList
            data={filteredCountries}
            renderItem={renderCountryItem}
            keyExtractor={(item) => item.code}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        </View>
      </Modal>
    </View>
  );
}
