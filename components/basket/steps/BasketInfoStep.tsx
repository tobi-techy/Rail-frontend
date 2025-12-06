import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Check, ArrowLeft } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import type { BasketInfo } from '../BasketCreationFlow';
import { InputField } from '@/components';
import { router } from 'expo-router';

const MATURITY_OPTIONS = [
  { value: '3m', label: '3 months', months: 3 },
  { value: '6m', label: '6 months', months: 6 },
  { value: '9m', label: '9 months', months: 9 },
  { value: '1y', label: '1 year', months: 12 },
  { value: '2y', label: '2 years', months: 24 },
  { value: 'custom', label: 'Choose', months: 0 },
];

interface BasketInfoStepProps {
  initialData: BasketInfo;
  onNext: (data: BasketInfo) => void;
  onBack: () => void;
}

export const BasketInfoStep: React.FC<BasketInfoStepProps> = ({
  initialData,
  onNext,
  onBack,
}) => {
  const [name, setName] = useState(initialData.name);
  const [ticker, setTicker] = useState(initialData.ticker);
  const [description, setDescription] = useState(initialData.description);
  const [lockPeriod, setLockPeriod] = useState(initialData.lockPeriod);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState<Date>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date;
  });
  const [tempDate, setTempDate] = useState<Date>(customDate);

  const isValid = name.trim() && ticker.trim() && description.trim();

  const handleNext = () => {
    if (isValid) {
      const maturityDate = lockPeriod === 'custom' ? customDate.toISOString() : undefined;
      onNext({ name, ticker, description, lockPeriod, maturityDate } as any);
    }
  };

  const handleMaturitySelect = (value: string) => {
    if (value === 'custom') {
      setShowDatePicker(true);
    }
    setLockPeriod(value);
  };

  const handleDateConfirm = () => {
    setCustomDate(tempDate);
    setShowDatePicker(false);
  };

  const formatCustomDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  return (
    <View className="flex-1">
        <View className="flex-row items-center pl-[14px] gap-x-2">
        <ArrowLeft size={24} onPress={() => router.back()} />
        <Text className='text-[24px] font-body-semibold'>Enter basket details</Text>
       </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
      <InputField
            label='Basket Name'
            value={name}
            onChangeText={setName}
            placeholder="e.g., Tech Growth Portfolio"
            placeholderTextColor="#9CA3AF"
            maxLength={50}
          />

        <InputField
          label='Ticker Symbol'
            value={ticker}
            onChangeText={(text) => setTicker(text.toUpperCase())}
            placeholder="e.g., TECH-01"
            placeholderTextColor="#9CA3AF"
            maxLength={10}
            autoCapitalize="characters"
          />

         <InputField
            label='Description'
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your investment strategy..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={200}
          />

        {/* Maturity Date */}
        <View className="mb-8">
          <Text className="mb-3 text-[17px] font-body-medium text-[#8E9AAB]">
            Choose your maturity date
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {MATURITY_OPTIONS.map((option) => {
              const isSelected = lockPeriod === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => handleMaturitySelect(option.value)}
                  activeOpacity={0.85}
                  className={`flex-1 min-w-[31%] items-center rounded-2xl
                    px-4 py-5
                    shadow-sm
                    border
                    ${isSelected 
                        ? 'bg-[#2563EB] border-[#2563EB]' 
                        : 'bg-white border-gray-200'
                    }`}
                  style={{
                    elevation: isSelected ? 3 : 1,
                  }}
                >
                  <Text
                    className={`text-[15px] font-body-semibold ${
                      isSelected ? 'text-white' : 'text-[#1C2A3D]'
                    }`}
                  >
                    {option.value === 'custom' && lockPeriod === 'custom'
                      ? formatCustomDate(customDate).split(',')[0]
                      : option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View className="border-t border-gray-100 px-6 py-4">
        <Button
          title="Continue"
          onPress={handleNext}
          disabled={!isValid}
          className="mb-3 bg-[#070914]"
        />
      </View>

      {/* Custom Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-3xl bg-white pb-8 pt-4">
            {/* Header */}
            <View className="mb-4 flex-row items-center justify-between px-6">
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                className="h-12 w-12 items-center justify-center rounded-full bg-gray-100"
                activeOpacity={0.7}
              >
                <X size={20} color="#070914" strokeWidth={2} />
              </TouchableOpacity>

              <Text className="text-[18px] font-body-semibold text-[#070914]">
                Set maturity date
              </Text>

              <TouchableOpacity
                onPress={handleDateConfirm}
                className="h-12 w-12 items-center justify-center rounded-full bg-[#4A90E2]"
                activeOpacity={0.7}
              >
                <Check size={20} color="white" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Date Picker */}
            <DateTimePicker
              value={tempDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setTempDate(selectedDate);
                  if (Platform.OS === 'android') {
                    setCustomDate(selectedDate);
                    setShowDatePicker(false);
                  }
                }
              }}
              minimumDate={new Date()}
              textColor="#070914"
              style={{ height: 200 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};
