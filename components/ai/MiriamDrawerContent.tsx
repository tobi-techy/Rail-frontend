import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { GlassView } from '@/components/ui/GlassView';
import {
  IconComponent as HugeiconsIcon,
  Search01Icon,
  Cancel01Icon,
  Add01Icon,
  MoreHorizontalIcon,
  Clock01Icon,
  Delete02Icon,
  PinIcon,
} from '@/lib/icons';
import { useAIChatStore } from '@/stores/aiChatStore';
import * as Haptics from '@/utils/platformHaptics';

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

// ─── Glass Popover Menu ──────────────────────────────────────────

function ThreadOptionsMenu({
  visible,
  anchor,
  onClose,
  onPin,
  onDelete,
}: {
  visible: boolean;
  anchor: { x: number; y: number } | null;
  onClose: () => void;
  onPin: () => void;
  onDelete: () => void;
}) {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 150 });
      scale.value = withSpring(1, { damping: 20, stiffness: 340 });
    } else {
      opacity.value = withTiming(0, { duration: 100 });
      scale.value = withTiming(0.85, { duration: 100 });
    }
  }, [visible, opacity, scale]);

  const menuStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible || !anchor) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="absolute inset-0" />
      </TouchableWithoutFeedback>
      <Animated.View
        style={[
          menuStyle,
          {
            position: 'absolute',
            top: anchor.y,
            right: 20,
            width: 200,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 12,
          },
        ]}>
        <GlassView
          effect="regular"
          white
          fallbackColor="rgba(255,255,255,0.92)"
          style={{ borderRadius: 14, overflow: 'hidden' }}>
          <Pressable
            onPress={() => { onClose(); onPin(); }}
            className="flex-row items-center justify-between px-4 py-3.5 active:bg-black/[0.05]">
            <Text className="font-body-medium text-[15px] text-[#1C1C1E]">Pin</Text>
            <HugeiconsIcon icon={PinIcon} size={18} color="#1C1C1E" />
          </Pressable>
          <View className="mx-4 h-[0.5px] bg-black/[0.08]" />
          <Pressable
            onPress={() => { onClose(); onDelete(); }}
            className="flex-row items-center justify-between px-4 py-3.5 active:bg-black/[0.05]">
            <Text className="font-body-medium text-[15px] text-[#FF3B30]">Delete</Text>
            <HugeiconsIcon icon={Delete02Icon} size={18} color="#FF3B30" />
          </Pressable>
        </GlassView>
      </Animated.View>
    </Modal>
  );
}

export function MiriamDrawerContent({ navigation }: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuConvId, setMenuConvId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const inputRef = useRef<TextInput>(null);

  const { conversations, activeConversationId, selectConversation, clearActiveConversation, fetchProactiveOpener, deleteConversation } =
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

  // Strip mic/voice emoji prefix from display titles
  const stripVoiceEmoji = (title: string) => title.replace(/^🎙️\s*/, '');

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-5 pb-3 pt-4">
        <Text className="font-heading-bold text-[28px] text-[#1A1A1A]">Miriam</Text>
      </View>

      {/* Search bar */}
      <View className="mx-5 mb-4" style={{ height: 44 }}>
        <GlassView
          effect="regular"
          white
          fallbackColor="#F2F2F2"
          style={{ borderRadius: 22, height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }}>
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
        </GlassView>
      </View>

      {/* Thread list */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
        {filtered.map((conv) => {
          const isActive = conv.id === activeConversationId;
          const dateLabel = relativeDateLabel(conv.updated_at ?? conv.created_at);
          // Show title as summary; truncate long titles with ellipsis via numberOfLines
          const summary = conv.title;

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
                  {stripVoiceEmoji(conv.title)}
                </Text>
                <Pressable
                  onPress={(e) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const { pageY } = e.nativeEvent;
                    setMenuAnchor({ x: 0, y: pageY });
                    setMenuConvId(conv.id);
                  }}
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
                {stripVoiceEmoji(summary)}
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
          accessibilityRole="button"
          accessibilityLabel="New Chat">
          <GlassView
            effect="regular"
            interactive
            white
            fallbackColor="rgba(0,0,0,0.08)"
            style={{ borderRadius: 100, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 }}>
            <HugeiconsIcon icon={Add01Icon} size={18} color="#1A1A1A" />
            <Text className="ml-2 font-heading-semibold text-[15px] text-[#1A1A1A]">New Chat</Text>
          </GlassView>
        </Pressable>
      </View>

      <ThreadOptionsMenu
        visible={!!menuConvId}
        anchor={menuAnchor}
        onClose={() => setMenuConvId(null)}
        onPin={() => { /* TODO: pin API */ }}
        onDelete={() => { if (menuConvId) deleteConversation(menuConvId); }}
      />
    </View>
  );
}
