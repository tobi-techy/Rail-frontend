import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Switch } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { GorhomBottomSheet } from './GorhomBottomSheet';
import {
  WhatsappLogo,
  IMessageLogo,
  TelegramLogo,
  PlaidLogo,
} from '@/assets/svg/company';
import { InternetIcon, IconComponent as HugeiconsIcon } from '@/lib/icons';

// ─── Data ────────────────────────────────────────────────────────

interface Connection {
  id: string;
  name: string;
  description: string;
  Logo?: React.ComponentType<SvgProps>;
  iconFallback?: boolean;
}

const CONNECTIONS: Connection[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Search messages and media',
    Logo: WhatsappLogo,
  },
  {
    id: 'imessage',
    name: 'iMessage',
    description: 'Access conversation history',
    Logo: IMessageLogo,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Search chats and channels',
    Logo: TelegramLogo,
  },
  {
    id: 'plaid',
    name: 'Plaid',
    description: 'Connect bank accounts securely',
    Logo: PlaidLogo,
  },
  {
    id: 'mono',
    name: 'Mono',
    description: 'Link African bank accounts',
    iconFallback: true,
  },
];

// ─── Connection Row ──────────────────────────────────────────────

function ConnectionRow({
  item,
  enabled,
  onToggle,
}: {
  item: Connection;
  enabled: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <View className="flex-row items-center py-4">
      {/* Icon */}
      <View className="mr-3.5 h-10 w-10 items-center justify-center">
        {item.Logo ? (
          <item.Logo width={32} height={32} />
        ) : (
          <View className="h-8 w-8 items-center justify-center rounded-lg bg-[#E8E8E6]">
            <HugeiconsIcon icon={InternetIcon} size={18} color="#5F5F5F" />
          </View>
        )}
      </View>

      {/* Text */}
      <View className="flex-1">
        <Text className="font-body-medium text-[16px] text-[#1C1C1E]">{item.name}</Text>
        <Text className="mt-0.5 font-body text-[13px] text-[#8C8C8C]">{item.description}</Text>
      </View>

      {/* Toggle */}
      <Switch
        value={enabled}
        onValueChange={() => onToggle(item.id)}
        trackColor={{ false: '#E0E0DE', true: '#1A7A6D' }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#E0E0DE"
      />
    </View>
  );
}

// ─── Sheet ───────────────────────────────────────────────────────

interface AppsSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function AppsSheet({ visible, onClose }: AppsSheetProps) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});

  const handleToggle = useCallback((id: string) => {
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return (
    <GorhomBottomSheet visible={visible} onClose={onClose} glassBackground>
      <View className="pt-2 pb-2">
        {/* Header */}
        <Text className="mb-2 font-body-medium text-[22px] text-[#1C1C1E]">Connections</Text>

        {/* List */}
        {CONNECTIONS.map((item, index) => (
          <View key={item.id}>
            <ConnectionRow
              item={item}
              enabled={!!enabled[item.id]}
              onToggle={handleToggle}
            />
            {index < CONNECTIONS.length - 1 && (
              <View className="ml-[54px] border-b border-black/[0.06]" />
            )}
          </View>
        ))}

        {/* Manage link */}
        <Pressable className="mt-3 flex-row items-center gap-2" accessibilityRole="button">
          <View className="h-5 w-5 items-center justify-center rounded-full border border-[#1A7A6D]">
            <Text className="text-[12px] font-bold text-[#1A7A6D]">+</Text>
          </View>
          <Text className="font-body-medium text-[15px] text-[#1A7A6D]">Manage connectors</Text>
        </Pressable>
      </View>
    </GorhomBottomSheet>
  );
}
