import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import {
  IconComponent as HugeiconsIcon,
  Search01Icon,
  Cancel01Icon,
  Add01Icon,
  MoreHorizontalIcon,
  Clock01Icon,
} from '@/lib/icons';
import { useAIChatStore } from '@/stores/aiChatStore';

function relativeDateLabel(iso: string): string {
  if (!iso) return '';
  const now = new Date();
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return '1d';
  if (diffDays < 7) return `${diffDays}d`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
  return `${Math.floor(diffDays / 30)}mo`;
}

export function MiriamDrawerContent({ navigation }: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const { conversations, activeConversationId, selectConversation, clearActiveConversation, fetchProactiveOpener } =
    useAIChatStore();

  // Pre-fetch proactive opener when drawer opens so it's ready for chat
  useEffect(() => {
    fetchProactiveOpener();
  }, [fetchProactiveOpener]);

  const closeDrawer = useCallback(() => navigation.closeDrawer(), [navigation]);

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
    ? (conversations ?? []).filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : (conversations ?? []);

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-5 pb-3 pt-4">
        <Text className="font-heading-bold text-[28px] text-[#1A1A1A]">Miriam</Text>
      </View>

      {/* Search bar */}
      <View className="mx-5 mb-4 flex-row items-center rounded-2xl bg-[#F2F2F2] px-4" style={{ height: 44 }}>
        <HugeiconsIcon icon={Search01Icon} size={17} color="#9CA3AF" />
        <TextInput
          ref={inputRef}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search threads"
          placeholderTextColor="#9CA3AF"
          className="ml-2 flex-1 font-body text-[15px] text-[#1A1A1A]"
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)}>
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <HugeiconsIcon icon={Cancel01Icon} size={15} color="#9CA3AF" />
            </Pressable>
          </Animated.View>
        )}
      </View>

      {/* Thread list */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
        {filtered.map((conv) => {
          const isActive = conv.id === activeConversationId;
          const dateLabel = relativeDateLabel(conv.updated_at ?? conv.created_at);
          const summary = conv.title.length > 40
            ? conv.title
            : `Conversation about ${conv.title.toLowerCase()}`;

          return (
            <Pressable
              key={conv.id}
              onPress={() => handleSelect(conv.id)}
              className={`border-b border-black/[0.06] px-5 py-4 active:bg-gray-50 ${isActive ? 'bg-gray-50' : ''}`}
              accessibilityRole="button"
              accessibilityLabel={conv.title}>
              {/* Title + three-dot */}
              <View className="flex-row items-start justify-between">
                <Text
                  className="mr-3 flex-1 font-heading-semibold text-[16px] leading-[22px] text-[#1A1A1A]"
                  numberOfLines={2}>
                  {conv.title}
                </Text>
                <Pressable
                  onPress={(e) => e.stopPropagation?.()}
                  hitSlop={12}
                  className="mt-0.5"
                  accessibilityRole="button"
                  accessibilityLabel="Thread options">
                  <HugeiconsIcon icon={MoreHorizontalIcon} size={20} color="#C4C4C4" />
                </Pressable>
              </View>

              {/* Summary */}
              <Text
                className="mt-1 font-body text-[14px] leading-[20px] text-[#8C8C8C]"
                numberOfLines={2}>
                {summary}
              </Text>

              {/* Timestamp */}
              <View className="mt-2 flex-row items-center gap-1.5">
                <HugeiconsIcon icon={Clock01Icon} size={13} color="#C4C4C4" />
                <Text className="font-body text-[13px] text-[#C4C4C4]">{dateLabel}</Text>
              </View>
            </Pressable>
          );
        })}

        {filtered.length === 0 && (
          <Text className="mt-10 text-center font-body text-[14px] text-[#C4C4C4]">
            {searchQuery ? 'No threads found' : 'No conversations yet'}
          </Text>
        )}
      </ScrollView>

      {/* New Chat button — bottom right */}
      <View
        className="absolute bottom-0 right-5"
        style={{ paddingBottom: insets.bottom + 20 }}>
        <Pressable
          onPress={handleNewChat}
          className="flex-row items-center rounded-full bg-primary px-5 py-3.5 shadow-md active:opacity-80"
          style={{ elevation: 4 }}>
          <HugeiconsIcon icon={Add01Icon} size={18} color="#FFFFFF" />
          <Text className="ml-2 font-heading-semibold text-[15px] text-white">New Chat</Text>
        </Pressable>
      </View>
    </View>
  );
}
