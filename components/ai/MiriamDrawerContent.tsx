import React, { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import {
  IconComponent as HugeiconsIcon,
  UserIcon,
  Search01Icon,
  Cancel01Icon,
  Shield01Icon,
  SmartPhone01Icon,
  FlashIcon,
  Add01Icon,
} from '@/lib/icons';
import { useAIChatStore } from '@/stores/aiChatStore';
import type { PhosphorIcon } from '@/lib/icons';

const MENU_ITEMS: { label: string; icon: PhosphorIcon }[] = [
  { label: 'Personalization', icon: UserIcon },
  { label: 'Apps', icon: SmartPhone01Icon },
  { label: 'Memory', icon: FlashIcon },
  { label: 'Money Guard', icon: Shield01Icon },
];

export function MiriamDrawerContent({ navigation }: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const { conversations, activeConversationId, selectConversation, clearActiveConversation } =
    useAIChatStore();

  const closeDrawer = useCallback(() => {
    navigation.closeDrawer();
  }, [navigation]);

  const openSearch = useCallback(() => {
    setSearchActive(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchActive(false);
    setSearchQuery('');
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      selectConversation(id);
      closeDrawer();
    },
    [selectConversation, closeDrawer]
  );

  const handleNewChat = useCallback(() => {
    clearActiveConversation();
    closeDrawer();
  }, [clearActiveConversation, closeDrawer]);

  const filtered = searchQuery
    ? (conversations ?? []).filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : (conversations ?? []);

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-5 pb-4 pt-3">
        {!searchActive ? (
          <>
            <Animated.Text
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              className="flex-1 text-[28px] font-bold text-gray-900">
              Miriam
            </Animated.Text>
            <Pressable onPress={openSearch} hitSlop={12} className="mr-3">
              <HugeiconsIcon icon={Search01Icon} size={24} color="#1F2937" />
            </Pressable>
            <Pressable
              onPress={closeDrawer}
              className="h-9 w-9 items-center justify-center rounded-full bg-gray-100">
              <HugeiconsIcon icon={Cancel01Icon} size={16} color="#374151" />
            </Pressable>
          </>
        ) : (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            className="flex-1 flex-row items-center rounded-xl bg-gray-100 px-3"
            style={{ height: 42 }}>
            <HugeiconsIcon icon={Search01Icon} size={18} color="#9CA3AF" />
            <TextInput
              ref={inputRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search conversations"
              placeholderTextColor="#9CA3AF"
              className="ml-2 flex-1 text-[15px] text-gray-900"
              returnKeyType="search"
            />
            <Pressable onPress={closeSearch} hitSlop={8}>
              <HugeiconsIcon icon={Cancel01Icon} size={16} color="#6B7280" />
            </Pressable>
          </Animated.View>
        )}
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}>
        {/* Menu Items */}
        {!searchActive && (
          <Animated.View layout={Layout.duration(200)} className="mb-5 mt-1">
            {MENU_ITEMS.map((item) => (
              <Pressable
                key={item.label}
                className="flex-row items-center py-[14px] active:opacity-70">
                <HugeiconsIcon icon={item.icon} size={22} color="#1F2937" weight="bold" />
                <Text className="ml-4 text-[16px] font-bold text-gray-900">{item.label}</Text>
              </Pressable>
            ))}
          </Animated.View>
        )}

        {/* Recents */}
        <Text className="mb-2 text-[15px] font-semibold text-gray-900">Recents</Text>
        {filtered.map((conv) => (
          <Pressable
            key={conv.id}
            onPress={() => handleSelect(conv.id)}
            className={`rounded-lg py-3 active:opacity-70 ${
              conv.id === activeConversationId ? 'bg-gray-50 px-3' : ''
            }`}>
            <Text numberOfLines={1} className="text-[15px] text-gray-800">
              {conv.title}
            </Text>
          </Pressable>
        ))}
        {filtered.length === 0 && (
          <Text className="mt-4 text-center text-[14px] text-gray-400">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </Text>
        )}
      </ScrollView>

      {/* New Chat FAB */}
      <View className="absolute bottom-0 right-5" style={{ paddingBottom: insets.bottom + 16 }}>
        <Pressable
          onPress={handleNewChat}
          className="flex-row items-center rounded-full bg-primary px-5 py-3.5 shadow-lg"
          style={{ elevation: 4 }}>
          <HugeiconsIcon icon={Add01Icon} size={18} color="#fff" />
          <Text className="ml-2 text-[15px] font-semibold text-white">Chat</Text>
        </Pressable>
      </View>
    </View>
  );
}
