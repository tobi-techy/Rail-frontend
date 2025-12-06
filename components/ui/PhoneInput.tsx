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

    // Format phone number based on country
    const formatPhoneNumber = (phone: string, country: CountryCode) => {
      // Remove all non-numeric characters
      const cleaned = phone.replace(/\D/g, '');
      
      if (country.code === 'CA' || country.code === 'US') {
        // North American format: (XXX) XXX-XXXX
        if (cleaned.length >= 6) {
          return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
        } else if (cleaned.length >= 3) {
          return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
        } else {
          return cleaned;
        }
      }
      
      // For other countries, return with spaces every 3-4 digits
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
      // Focus input after selecting country
      setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleFocus = () => {
      setIsFocused(true);
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
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
      outputRange: ['#E5E7EB', '#374151'],
    });

    const labelScale = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.85],
    });

    const labelTranslateY = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -28],
    });

    const formattedValue = formatPhoneNumber(value, selectedCountry);

    return (
      <View className={`w-full ${containerClassName}`}>
        <View className="relative">
          {/* Animated Border */}
          <Animated.View
            style={{
              borderColor,
              borderWidth: 2,
            }}
            className="rounded-2xl bg-gray-50 focus:bg-white"
          >
            {/* Input Container */}
            <View className="flex-row items-center">
              {/* Country Picker */}
              {showCountryPicker && (
                <TouchableOpacity
                  onPress={() => setShowPicker(true)}
                  className="flex-row items-center border-r border-gray-200 px-4 py-4"
                >
                  <Text className="mr-1 text-lg">{selectedCountry.flag}</Text>
                  <Text className="mr-1 font-sf-pro-medium text-base text-gray-700">
                    {selectedCountry.dialCode}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>
              )}

              {/* Text Input */}
              <View className="flex-1 relative">
                <TextInput
                  ref={inputRef}
                  value={formattedValue}
                  onChangeText={handleTextChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  className="px-4 py-4 font-sf-pro-medium text-base text-gray-900"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  {...props}
                />
                
                {/* Floating Label */}
                {label && (
                  <Animated.Text
                    style={{
                      transform: [
                        { scale: labelScale },
                        { translateY: labelTranslateY },
                      ],
                    }}
                    className={`absolute left-4 font-sf-pro-medium text-gray-500 ${
                      isFocused || value ? 'top-2 text-sm' : 'top-4 text-base'
                    }`}
                  >
                    {label}
                  </Animated.Text>
                )}
              </View>

              {/* Clear Button */}
              {value && (
                <TouchableOpacity
                  onPress={() => onChangeText('', selectedCountry.dialCode, '')}
                  className="mr-4 rounded-full bg-gray-300 p-1"
                >
                  <Ionicons name="close" size={16} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </View>

        {/* Error Message */}
        {error && (
          <View className="mt-2 flex-row items-center rounded-xl bg-red-50 px-3 py-2">
            <View className="mr-2 rounded-full bg-red-100 p-1">
              <Ionicons name="close-circle" size={16} color="#DC2626" />
            </View>
            <Text className="font-sf-pro-medium text-sm text-red-700">{error}</Text>
          </View>
        )}

        {/* Country Picker Modal */}
        <Modal
          visible={showPicker}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View className="flex-1 bg-white">
            {/* Header */}
            <View className="border-b border-gray-200 px-6 py-4">
              <View className="flex-row items-center justify-between">
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="font-sf-pro-semibold text-lg text-gray-900">
                  Select Country
                </Text>
                <View style={{ width: 24 }} />
              </View>
            </View>

            {/* Country List */}
            <ScrollView className="flex-1">
              {countryCodes.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  onPress={() => handleCountrySelect(country)}
                  className={`flex-row items-center border-b border-gray-100 px-6 py-4 ${
                    selectedCountry.code === country.code ? 'bg-gray-50' : ''
                  }`}
                >
                  <Text className="mr-3 text-2xl">{country.flag}</Text>
                  <View className="flex-1">
                    <Text className="font-sf-pro-medium text-base text-gray-900">
                      {country.country}
                    </Text>
                    <Text className="font-sf-pro-regular text-sm text-gray-500">
                      {country.dialCode}
                    </Text>
                  </View>
                  {selectedCountry.code === country.code && (
                    <Ionicons name="checkmark" size={20} color="#059669" />
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