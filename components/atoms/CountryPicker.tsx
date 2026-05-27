import React, { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList } from 'react-native';
import { Ionicons } from './SafeIonicons';
import { InputField } from './InputField';

interface Country {
  code: string;
  name: string;
  flag: string;
}

interface CountryPickerProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onSelect: (country: Country) => void;
  error?: string;
  required?: boolean;
  variant?: 'light' | 'dark' | 'blended';
}

// Common countries list with flags
const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
];

export function CountryPicker({
  label,
  placeholder = 'Select your country',
  value,
  onSelect,
  error,
  required = false,
  variant = 'blended',
}: CountryPickerProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isDark = variant === 'dark';
  const hasError = !!error;

  const selectedCountry = COUNTRIES.find((country) => country.name === value);

  const filteredCountries = COUNTRIES.filter((country) =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getContainerStyle = () => {
    if (isDark) {
      return `h-[56px] rounded-lg border px-4 ${hasError ? 'border-destructive' : 'border-white/30'} bg-white/5`;
    }
    if (hasError) {
      return 'h-[56px] rounded-lg border border-destructive bg-parchment-card px-4';
    }
    if (isModalVisible) {
      return 'h-[56px] rounded-lg border border-fog bg-parchment-card px-4';
    }
    return 'h-[56px] rounded-lg border border-[#f7f2e8] bg-parchment-card px-4';
  };

  const handleCountrySelect = (country: Country) => {
    onSelect(country);
    setIsModalVisible(false);
    setSearchQuery('');
  };

  const renderCountryItem = ({ item }: { item: Country }) => (
    <Pressable
      onPress={() => handleCountrySelect(item)}
      className="flex-row items-center border-b border-fog/40 px-5 py-3">
      <Text className="mr-3 text-2xl">{item.flag}</Text>
      <Text className="flex-1 font-body text-body text-text-primary">{item.name}</Text>
    </Pressable>
  );

  return (
    <View className={isDark ? 'mb-2' : 'mb-4'}>
      {label && (
        <View className="mb-1 flex-row">
          <Text
            className={`font-subtitle text-body ${isDark ? 'text-white/60' : 'text-text-primary'}`}>
            {label}
          </Text>
          {required && (
            <Text
              className={`font-subtitle text-body ${isDark ? 'text-white/60' : 'text-destructive'}`}>
              {' '}
              *
            </Text>
          )}
        </View>
      )}

      <Pressable
        onPress={() => setIsModalVisible(true)}
        className={`flex-row items-center justify-between ${getContainerStyle()}`}>
        <View className="flex-1 flex-row items-center">
          {selectedCountry ? (
            <>
              <Text className="mr-3 text-2xl">{selectedCountry.flag}</Text>
              <Text
                className={`font-body text-body ${isDark ? 'text-white' : 'text-text-primary'}`}>
                {selectedCountry.name}
              </Text>
            </>
          ) : (
            <Text
              className={`font-body text-body ${isDark ? 'text-white/50' : 'text-text-tertiary'}`}>
              {placeholder}
            </Text>
          )}
        </View>
        <Ionicons
          name="chevron-down"
          size={20}
          color={hasError ? '#ff2b3a' : isDark ? '#FFFFFF' : isModalVisible ? '#0090ff' : '#848281'}
        />
      </Pressable>

      {error && (
        <Text
          className={`mt-1 font-caption text-caption ${isDark ? 'text-white' : 'text-destructive'}`}>
          {error}
        </Text>
      )}

      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-parchment-card">
          <View className="flex-row items-center justify-between border-b border-fog/40 px-5 py-4">
            <Text className="font-subtitle text-[30px] text-text-primary">Select Country</Text>
            <Pressable onPress={() => setIsModalVisible(false)} className="p-2">
              <Ionicons name="close" size={24} color="#000000" />
            </Pressable>
          </View>

          <View className="border-b border-fog/40 px-5 py-3">
            <InputField
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search countries..."
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
