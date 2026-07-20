import React from 'react';
import { View, Text, Pressable, Keyboard } from 'react-native';
import { GlassView } from '@/components/ui/GlassView';
import { MiriamCharacter } from '@/components/ai/MiriamCharacter';
import {
  ArrowLeft01Icon,
  ArrowDown01Icon,
  Add01Icon,
  IconComponent as HugeiconsIcon,
} from '@/lib/icons';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';

interface Props {
  paddingTop: number;
  agentMode: boolean;
  isKeyboardVisible: boolean;
  onBack: () => void;
  onOpenDrawer: () => void;
  onNewThread: () => void;
}

export const ChatHeader = React.memo(function ChatHeader({
  paddingTop,
  agentMode,
  isKeyboardVisible,
  onBack,
  onOpenDrawer,
  onNewThread,
}: Props) {
  const haptics = useHaptics();

  return (
    <View style={{ paddingTop }} className="pb-2">
      <View className="relative min-h-[56px] items-center justify-center px-2">
        {/* Back */}
        <Pressable
          onPress={() => {
            haptics.selection();
            playUISound('dismiss');
            onBack();
          }}
          hitSlop={12}
          className="absolute left-2 h-10 w-10 items-center justify-center rounded-full active:bg-black/[0.05]"
          accessibilityRole="button"
          accessibilityLabel="Back">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#343433" />
        </Pressable>

        {/* Centered avatar + name (tap to open threads) */}
        <Pressable
          onPress={() => {
            haptics.selection();
            playUISound('buttonClick');
            onOpenDrawer();
          }}
          hitSlop={8}
          className="items-center"
          accessibilityRole="button"
          accessibilityLabel="Miriam — open conversations">
          <MiriamCharacter size={30} emotion={agentMode ? 'thinking' : 'happy'} animate={false} />
          <View className="mt-1 flex-row items-center gap-1">
            <Text className="font-body-medium text-[15px] text-charcoal-primary">Miriam</Text>
            <HugeiconsIcon icon={ArrowDown01Icon} size={13} color="#9C9C9C" />
          </View>
          {agentMode ? (
            <Text className="mt-0.5 font-body text-[10px] text-meadow-green">Agent mode</Text>
          ) : null}
        </Pressable>

        {/* Right actions */}
        <View className="absolute right-2 flex-row items-center gap-1">
          {isKeyboardVisible ? (
            <Pressable
              onPress={() => {
                haptics.selection();
                playUISound('buttonClick');
                Keyboard.dismiss();
              }}
              hitSlop={12}
              className="h-10 w-10 items-center justify-center rounded-full active:bg-black/[0.05]"
              accessibilityRole="button"
              accessibilityLabel="Dismiss keyboard">
              <HugeiconsIcon icon={ArrowDown01Icon} size={22} color="#848281" />
            </Pressable>
          ) : null}
          <GlassView
            effect="regular"
            interactive
            white
            fallbackColor="rgba(0,0,0,0.06)"
            style={{ borderRadius: 20 }}>
            <Pressable
              onPress={() => {
                haptics.selection();
                playUISound('buttonClick');
                onNewThread();
              }}
              hitSlop={12}
              className="h-10 w-10 items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="New thread">
              <HugeiconsIcon icon={Add01Icon} size={22} color="#343433" />
            </Pressable>
          </GlassView>
        </View>
      </View>
    </View>
  );
});
