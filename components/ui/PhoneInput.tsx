import React, { useState, useRef, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInputProps,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

const countryCodes: CountryCode[] = [
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
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
      countryCodes.find((c) => c.code === defaultCountry) || countryCodes[0]
    );
    const [showPicker, setShowPicker] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const animatedValue = useRef(new Animated.Value(0)).current;
    const inputRef = useRef<TextInput>(null);

    const formatPhoneNumber = (phone: string, country: CountryCode) => {
      const cleaned = phone.replace(/\D/g, '');
      if (country.code === 'CA' || country.code === 'US') {
        if (cleaned.length >= 6) {
          return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
        } else if (cleaned.length >= 3) {
          return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
        }
        return cleaned;
      }
      return cleaned.replace(/(\d{3,4})(?=\d)/g, '$1 ');
    };

    const handleTextChange = (text: string) => {
      const cleaned = text.replace(/\D/g, '');
      const formatted = formatPhoneNumber(cleaned, selectedCountry);
      onChangeText(cleaned, selectedCountry.dialCode, formatted);
    };

    const handleCountrySelect = (country: CountryCode) => {
      setSelectedCountry(country);
      setShowPicker(false);
      const formatted = formatPhoneNumber(value, country);
      onChangeText(value, country.dialCode, formatted);
      setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleFocus = () => {
      setIsFocused(true);
      Animated.timing(animatedValue, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    };

    const handleBlur = () => {
      setIsFocused(false);
      if (!value) {
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    };

    const borderColor = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['#F5F5F5', '#1B84FF'],
    });

    const formattedValue = formatPhoneNumber(value, selectedCountry);

    return (
      <View className={`w-full ${containerClassName}`}>
        <View className="relative">
          <Animated.View style={{ borderColor, borderWidth: 2 }} className="rounded-sm bg-surface">
            <View className="flex-row items-center">
              {showCountryPicker && (
                <TouchableOpacity
                  onPress={() => setShowPicker(true)}
                  className="min-h-[44px] flex-row items-center border-r border-surface px-4 py-4"
                  accessibilityRole="button"
                  accessibilityLabel={`Select country code, currently ${selectedCountry.country} ${selectedCountry.dialCode}`}
                  accessibilityHint="Opens country picker">
                  <Text className="mr-1 text-lg">{selectedCountry.flag}</Text>
                  <Text className="mr-1 font-body text-body text-text-primary">
                    {selectedCountry.dialCode}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#757575" />
                </TouchableOpacity>
              )}

              <View className="relative flex-1">
                <TextInput
                  ref={inputRef}
                  value={formattedValue}
                  onChangeText={handleTextChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  className="px-4 py-4 font-body text-body text-text-primary"
                  placeholderTextColor="#757575"
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  accessibilityLabel={label || 'Phone number'}
                  {...props}
                />
              </View>

              {value && (
                <TouchableOpacity
                  onPress={() => onChangeText('', selectedCountry.dialCode, '')}
                  className="mr-2 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-surface p-2"
                  accessibilityRole="button"
                  accessibilityLabel="Clear phone number">
                  <Ionicons name="close" size={16} color="#757575" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </View>

        {error && (
          <View className="mt-2 flex-row items-center rounded-sm bg-destructive/10 px-3 py-2">
            <View className="mr-2 rounded-full bg-destructive/20 p-1">
              <Ionicons name="close-circle" size={16} color="#F44336" />
            </View>
            <Text className="font-body text-caption text-destructive">{error}</Text>
          </View>
        )}

        <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet">
          <View className="flex-1 bg-background-main">
            <View className="border-b border-surface px-6 py-4">
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={() => setShowPicker(false)}
                  className="-ml-2 min-h-[44px] min-w-[44px] items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel="Close country picker">
                  <Ionicons name="close" size={24} color="#121212" />
                </TouchableOpacity>
                <Text className="font-headline-2 text-subtitle text-text-primary">
                  Select Country
                </Text>
                <View style={{ width: 44 }} />
              </View>
            </View>

            <ScrollView className="flex-1">
              {countryCodes.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  onPress={() => handleCountrySelect(country)}
                  className={`min-h-[56px] flex-row items-center border-b border-surface px-6 py-4 ${
                    selectedCountry.code === country.code ? 'bg-surface' : ''
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel={`${country.country}, ${country.dialCode}`}
                  accessibilityState={{ selected: selectedCountry.code === country.code }}>
                  <Text className="mr-3 text-2xl">{country.flag}</Text>
                  <View className="flex-1">
                    <Text className="font-body text-body text-text-primary">{country.country}</Text>
                    <Text className="font-caption text-caption text-text-secondary">
                      {country.dialCode}
                    </Text>
                  </View>
                  {selectedCountry.code === country.code && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color="#00C853"
                      accessibilityLabel="Selected"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Modal>
      </View>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
