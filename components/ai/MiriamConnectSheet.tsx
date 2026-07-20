import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { GorhomBottomSheet } from '@/components/sheets/GorhomBottomSheet';
import { Button } from '@/components/ui';
import { MiriamCharacter } from '@/components/ai';
import { useMiriamIntro } from '@/stores/miriamIntro';
import { useHaptics } from '@/hooks/useHaptics';
import {
  Message01Icon,
  FlashIcon,
  ShieldKeyIcon,
  IconComponent as HugeiconsIcon,
  type PhosphorIcon,
} from '@/lib/icons';

const POINTS: { icon: PhosphorIcon; title: string; body: string }[] = [
  {
    icon: Message01Icon,
    title: 'Chat right in iMessage',
    body: 'No app to open. Text Miriam like you text a friend.',
  },
  {
    icon: FlashIcon,
    title: 'She handles the busywork',
    body: 'Budgets, bills, savings, investing — ask and it’s done.',
  },
  {
    icon: ShieldKeyIcon,
    title: 'Money stays locked to you',
    body: 'Anything that moves money is approved here with Face ID.',
  },
];

/**
 * MiriamConnectSheet introduces the "Miriam on iMessage / WhatsApp" experience
 * and starts the linking flow. Opened from the tab-bar Miriam button via the
 * useMiriamIntro store; hosted once in the tabs layout.
 */
export function MiriamConnectSheet() {
  const visible = useMiriamIntro((s) => s.visible);
  const close = useMiriamIntro((s) => s.close);
  const { selection } = useHaptics();

  const onGetStarted = () => {
    selection();
    close();
    // Let the sheet dismiss before navigating. Cast: expo-router regenerates
    // typed routes for link-miriam on next build.
    setTimeout(() => router.push('/link-miriam' as any), 220);
  };

  const onMaybeLater = () => {
    selection();
    close();
  };

  return (
    <GorhomBottomSheet visible={visible} onClose={close} showCloseButton dismissible>
      <View className="items-center pb-1">
        <MiriamCharacter size={88} emotion="happy" animate={true} />
        <Text className="mt-4 text-center font-subtitle text-[22px] text-charcoal-primary">
          Meet Miriam on iMessage
        </Text>
        <Text className="mt-2 text-center font-body text-[15px] leading-[22px] text-graphite">
          Your money, handled in a text. Miriam watches your accounts, tells you what’s coming, and
          takes care of it — right in Messages.
        </Text>
      </View>

      <View className="mt-6 gap-4">
        {POINTS.map((p) => (
          <View key={p.title} className="flex-row items-start gap-3">
            <View className="size-10 items-center justify-center rounded-2xl bg-stone-surface">
              <HugeiconsIcon icon={p.icon} size={18} color="#ff3e00" strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text className="font-subtitle text-[15px] text-charcoal-primary">{p.title}</Text>
              <Text className="mt-0.5 font-body text-[13.5px] leading-[19px] text-graphite">
                {p.body}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View className="mt-7 gap-3">
        <Button title="Get started" onPress={onGetStarted} />
        <Pressable
          onPress={onMaybeLater}
          className="h-[50px] items-center justify-center rounded-full active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel="Maybe later">
          <Text className="font-button text-[15px] text-ash">Maybe later</Text>
        </Pressable>
      </View>
    </GorhomBottomSheet>
  );
}
