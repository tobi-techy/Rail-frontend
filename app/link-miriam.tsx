import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Button } from '@/components/ui';
import { platformService } from '@/api/services/platform.service';
import type { InitiateLinkResponse, PlatformType } from '@/api/types/platform';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import { logger } from '@/lib/logger';
import {
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Message01Icon,
  ArrowRight01Icon,
  IconComponent as HugeiconsIcon,
  type PhosphorIcon,
} from '@/lib/icons';

type Step = 'choose' | 'code' | 'linked';

const PLATFORMS: { id: PlatformType; label: string; hint: string; tint: string }[] = [
  { id: 'imessage', label: 'iMessage', hint: 'Text Miriam from Messages', tint: '#0090ff' },
  { id: 'whatsapp', label: 'WhatsApp', hint: 'Chat with Miriam on WhatsApp', tint: '#00ca48' },
];

export default function LinkMiriamScreen() {
  const { selection, notification, impact } = useHaptics();
  const [step, setStep] = useState<Step>('choose');
  const [platform, setPlatform] = useState<PlatformType | null>(null);
  const [link, setLink] = useState<InitiateLinkResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const startLinking = useCallback(
    async (p: PlatformType) => {
      playUISound('buttonClick');
      selection();
      setPlatform(p);
      setBusy(true);
      setError('');
      try {
        const res = await platformService.initiateLink(p);
        setLink(res);
        setStep('code');
      } catch (err: any) {
        impact();
        logger.warn('[LinkMiriam] initiate failed', { err: String(err) });
        setError(
          /conflict|409|already/i.test(String(err?.message))
            ? 'You already have a link in progress. Check your Messages, or try again in a minute.'
            : "Couldn't start linking. Please try again."
        );
      } finally {
        setBusy(false);
      }
    },
    [selection, impact]
  );

  // Poll for a completed link while showing the code.
  useEffect(() => {
    if (step !== 'code' || !platform) return;
    let active = true;
    const check = async () => {
      try {
        const linked = await platformService.listLinked();
        if (!active) return;
        if (linked.some((i) => String(i.platform).toLowerCase() === platform)) {
          stopPolling();
          notification();
          setStep('linked');
        }
      } catch {
        /* keep polling quietly */
      }
    };
    pollRef.current = setInterval(check, 3000);
    void check();
    return () => {
      active = false;
      stopPolling();
    };
  }, [step, platform, stopPolling, notification]);

  const openMessages = useCallback(async () => {
    if (!link) return;
    playUISound('buttonClick');
    selection();
    const url = link.deep_link;
    if (url) {
      try {
        await Linking.openURL(url);
        return;
      } catch {
        /* fall through to copy */
      }
    }
    await Clipboard.setStringAsync(link.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [link, selection]);

  const copyToken = useCallback(async () => {
    if (!link) return;
    playUISound('buttonClick');
    selection();
    await Clipboard.setStringAsync(link.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [link, selection]);

  const goBack = useCallback(() => {
    selection();
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [selection]);

  const platformLabel = PLATFORMS.find((p) => p.id === platform)?.label ?? 'Messages';

  return (
    <SafeAreaView className="flex-1 bg-warm-canvas">
      <StatusBar barStyle="dark-content" />
      <View className="flex-1 px-5">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(200)} className="mt-2">
          <Pressable
            onPress={step === 'code' ? () => setStep('choose') : goBack}
            className="size-11 items-center justify-center rounded-full bg-stone-surface active:scale-[0.95]"
            accessibilityRole="button"
            accessibilityLabel="Back">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#343433" strokeWidth={2} />
          </Pressable>
        </Animated.View>

        {step === 'choose' && (
          <View className="flex-1">
            <Animated.Text
              entering={FadeInUp.duration(260)}
              className="mt-6 font-heading text-[30px] leading-[36px] text-charcoal-primary">
              Where should Miriam{'\n'}reach you?
            </Animated.Text>
            <Animated.Text
              entering={FadeInUp.delay(60).duration(260)}
              className="mt-3 font-body text-[15px] leading-[22px] text-graphite">
              Pick a chat app. You’ll send a one-time code so Miriam knows it’s you.
            </Animated.Text>

            <View className="mt-8 gap-3">
              {PLATFORMS.map((p, i) => (
                <Animated.View key={p.id} entering={FadeInUp.delay(120 + i * 70).duration(260)}>
                  <Pressable
                    onPress={() => startLinking(p.id)}
                    disabled={busy}
                    className="flex-row items-center gap-4 rounded-3xl border border-stone-surface bg-parchment-card px-4 py-4 active:scale-[0.99]"
                    style={{ opacity: busy && platform !== p.id ? 0.5 : 1 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Connect ${p.label}`}>
                    <View
                      className="size-12 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${p.tint}1A` }}>
                      <HugeiconsIcon
                        icon={Message01Icon}
                        size={22}
                        color={p.tint}
                        strokeWidth={2}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-subtitle text-[17px] text-charcoal-primary">
                        {p.label}
                      </Text>
                      <Text className="mt-0.5 font-body text-[13px] text-ash">{p.hint}</Text>
                    </View>
                    {busy && platform === p.id ? (
                      <ActivityIndicator size="small" color={p.tint} />
                    ) : (
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={20}
                        color="#a7a7a7"
                        strokeWidth={2}
                      />
                    )}
                  </Pressable>
                </Animated.View>
              ))}
            </View>

            {error ? (
              <Text className="mt-4 font-body text-[13px] text-coral-red">{error}</Text>
            ) : null}
          </View>
        )}

        {step === 'code' && link && (
          <View className="flex-1">
            <Animated.Text
              entering={FadeInUp.duration(260)}
              className="mt-6 font-heading text-[28px] leading-[34px] text-charcoal-primary">
              Send this code to{'\n'}Miriam on {platformLabel}
            </Animated.Text>
            <Animated.Text
              entering={FadeInUp.delay(60).duration(260)}
              className="mt-3 font-body text-[15px] leading-[22px] text-graphite">
              Tap below to open {platformLabel} with the code ready. Just hit send — Miriam links
              you automatically.
            </Animated.Text>

            {/* Code chip */}
            <Animated.View
              entering={FadeInUp.delay(120).duration(260)}
              className="mt-7 flex-row items-center justify-between rounded-3xl border border-stone-surface bg-parchment-card px-5 py-5">
              <Text
                className="font-mono-bold text-[26px] tracking-[3px] text-charcoal-primary"
                style={{ fontVariant: ['tabular-nums'] }}
                selectable>
                {link.token}
              </Text>
              <Pressable
                onPress={copyToken}
                hitSlop={10}
                className="size-10 items-center justify-center rounded-full bg-stone-surface active:scale-[0.95]"
                accessibilityRole="button"
                accessibilityLabel="Copy code">
                <HugeiconsIcon
                  icon={copied ? CheckmarkCircle02Icon : Copy01Icon}
                  size={18}
                  color={copied ? '#00ca48' : '#343433'}
                  strokeWidth={2}
                />
              </Pressable>
            </Animated.View>

            {copied ? (
              <Text className="mt-2 text-center font-body text-[12.5px] text-meadow-green">
                Code copied
              </Text>
            ) : null}

            <View className="mt-5 flex-row items-center justify-center gap-2">
              <ActivityIndicator size="small" color="#a7a7a7" />
              <Text className="font-body text-[13px] text-ash">Waiting for your message…</Text>
            </View>

            <View className="flex-1" />

            <View className="pb-2">
              <Button title={`Open ${platformLabel}`} onPress={openMessages} />
              <Pressable
                onPress={goBack}
                className="mt-3 h-[50px] items-center justify-center rounded-full active:opacity-70"
                accessibilityRole="button">
                <Text className="font-button text-[15px] text-ash">I’ll do this later</Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 'linked' && (
          <View className="flex-1 items-center justify-center">
            <Animated.View entering={ZoomIn.springify().damping(14)}>
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                size={76}
                color="#00ca48"
                strokeWidth={2}
              />
            </Animated.View>
            <Animated.Text
              entering={FadeInUp.delay(120).duration(260)}
              className="mt-5 font-heading text-[26px] text-charcoal-primary">
              You’re connected
            </Animated.Text>
            <Animated.Text
              entering={FadeInUp.delay(180).duration(260)}
              className="mt-2 px-6 text-center font-body text-[15px] leading-[21px] text-graphite">
              Miriam can now reach you on {platformLabel}. Say hi — she’s ready.
            </Animated.Text>
            <View className="mt-9 w-full px-2">
              <Button title="Done" onPress={goBack} />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
