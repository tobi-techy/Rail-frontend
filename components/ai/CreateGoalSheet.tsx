import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import {
  Target02Icon,
  Beach02Icon,
  Home01Icon,
  Car01Icon,
  DiamondIcon,
  MortarboardIcon,
  Shield01Icon,
  Gif01Icon,
  IconComponent as HugeiconsIcon,
  Money01Icon,
  AirplaneTakeOff01Icon,
} from '@/lib/icons';
import { GorhomBottomSheet } from '@/components/sheets/GorhomBottomSheet';
import { aiService } from '@/api/services/ai.service';
import { useHaptics } from '@/hooks/useHaptics';
import { useFeedbackPopupStore } from '@/stores/feedbackPopupStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const ICONS = [
  { name: 'target-02', icon: Target02Icon },
  { name: 'beach-02', icon: Beach02Icon },
  { name: 'home-01', icon: Home01Icon },
  { name: 'car-01', icon: Car01Icon },
  { name: 'diamond', icon: DiamondIcon },
  { name: 'mortarboard', icon: MortarboardIcon },
  { name: 'shield-01', icon: Shield01Icon },
  { name: 'gift-01', icon: Gif01Icon },
  { name: 'money-01', icon: Money01Icon },
  { name: 'airplane-take-off-01', icon: AirplaneTakeOff01Icon },
];

export function CreateGoalSheet({ visible, onClose, onCreated }: Props) {
  const { impact, notification } = useHaptics();
  const showPopup = useFeedbackPopupStore((s) => s.showPopup);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('target-02');
  const [inviteTags, setInviteTags] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setName('');
    setAmount('');
    setSelectedIcon('target-02');
    setInviteTags('');
  };

  const handleCreate = async () => {
    if (!name.trim() || !amount.trim()) return;
    setLoading(true);
    try {
      const res = await aiService.createSharedGoal({
        name: name.trim(),
        target_amount: amount,
        icon_name: selectedIcon,
      });

      // Invite friends if tags provided
      const tags = inviteTags
        .split(',')
        .map((t) => t.trim().replace('@', ''))
        .filter(Boolean);
      if (tags.length > 0 && res.data?.id) {
        await aiService.inviteToGoal(res.data.id, tags);
      }

      notification('success');
      showPopup({
        type: 'success',
        title: 'Goal created!',
        message:
          tags.length > 0
            ? `Invited ${tags.length} friend${tags.length > 1 ? 's' : ''}`
            : undefined,
      });
      reset();
      onCreated();
    } catch {
      notification('error');
      showPopup({ type: 'error', title: 'Failed', message: 'Could not create goal' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <GorhomBottomSheet
      visible={visible}
      onClose={() => {
        reset();
        onClose();
      }}
      snapPoints={['75%']}
      dismissible>
      <ScrollView
        className="px-5 pb-8 pt-2"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Text className="mb-5 font-heading-bold text-lg text-text-primary">New shared goal</Text>

        {/* Icon picker */}
        <View className="mb-5 flex-row flex-wrap gap-2">
          {ICONS.map((item) => (
            <Pressable
              key={item.name}
              onPress={() => {
                impact();
                setSelectedIcon(item.name);
              }}
              className={`h-11 w-11 items-center justify-center rounded-full ${selectedIcon === item.name ? 'border-2 border-primary bg-[#FFF0ED]' : 'bg-[#f7f2e8]'}`}
              accessibilityRole="button"
              accessibilityLabel={`Select icon ${item.name}`}>
              <HugeiconsIcon
                icon={item.icon}
                size={20}
                color={selectedIcon === item.name ? '#ff3e00' : '#000'}
              />
            </Pressable>
          ))}
        </View>

        {/* Name */}
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Goal name (e.g. Ibiza Trip)"
          placeholderTextColor="#848281"
          className="mb-3 rounded-2xl bg-[#f7f2e8] px-4 py-4 font-body text-[15px] text-text-primary"
        />

        {/* Amount */}
        <View className="mb-3 flex-row items-center rounded-2xl bg-[#f7f2e8] px-4 py-4">
          <Text className="mr-1 font-mono-semibold text-xl text-text-primary">$</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="Target amount"
            placeholderTextColor="#848281"
            className="flex-1 font-mono-semibold text-xl text-text-primary"
          />
        </View>

        {/* Invite friends */}
        <TextInput
          value={inviteTags}
          onChangeText={setInviteTags}
          placeholder="Invite friends (rail tags, comma separated)"
          placeholderTextColor="#848281"
          className="mb-6 rounded-2xl bg-[#f7f2e8] px-4 py-4 font-body text-[15px] text-text-primary"
        />

        {/* Create button */}
        <Pressable
          onPress={handleCreate}
          disabled={loading || !name.trim() || !amount.trim()}
          className="items-center rounded-full bg-black py-5"
          style={{ opacity: loading || !name.trim() || !amount.trim() ? 0.5 : 1 }}
          accessibilityRole="button"
          accessibilityLabel="Create shared goal">
          <Text className="font-heading-bold text-[16px] text-white">
            {loading ? 'Creating...' : 'Create goal'}
          </Text>
        </Pressable>
      </ScrollView>
    </GorhomBottomSheet>
  );
}
