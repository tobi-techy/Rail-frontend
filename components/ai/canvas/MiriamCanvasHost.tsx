import React, { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMiriamCanvasStore } from '@/stores/miriamCanvasStore';
import { useAIHaptics } from '@/hooks/useAIHaptics';
import { cardEnter, cardExit, SPRING_SHEET } from '@/lib/motion';
import { GlassView } from '@/components/ui/GlassView';
import { Cancel01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import { canvasCardFor } from './registry';

/**
 * Global Miriam Canvas overlay. Mounted once above the navigator so cards float
 * over any screen (homescreen included), Siri-style. Driven entirely by the
 * canvas store; any Miriam surface pushes a directive and a card rises here.
 *
 * Glass discipline (Apple HIG + expo-liquid-glass): glass lives on the *chrome*
 * (backdrop scrim, grabber, dismiss button) — the card body stays a solid,
 * high-contrast surface so money/data is always legible. Reduce Transparency
 * swaps glass for solid fills.
 */
export function MiriamCanvasHost() {
  const insets = useSafeAreaInsets();
  const { onTap } = useAIHaptics();
  const current = useMiriamCanvasStore((s) => s.current);
  const dismiss = useMiriamCanvasStore((s) => s.dismiss);

  const [reduceTransparency, setReduceTransparency] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceTransparencyEnabled?.().then((v) => {
      if (mounted) setReduceTransparency(!!v);
    });
    const sub = AccessibilityInfo.addEventListener?.('reduceTransparencyChanged', (v: boolean) =>
      setReduceTransparency(!!v)
    );
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  const translateY = useSharedValue(0);
  useEffect(() => {
    translateY.value = 0;
  }, [current?.id, translateY]);

  const close = useCallback(() => {
    dismiss();
  }, [dismiss]);

  // Confirm cards must be answered, not swiped/tapped away.
  const lockedOpen = current?.intent === 'confirm_action';

  const panGesture = Gesture.Pan()
    .enabled(!lockedOpen)
    .activeOffsetY(12)
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 800) {
        runOnJS(close)();
      } else {
        translateY.value = withSpring(0, SPRING_SHEET);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!current) return null;

  const CardBody = canvasCardFor(current.card);

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents="box-none">
      {/* Backdrop — single dominant glass layer (skill rule #7) */}
      <Animated.View
        entering={FadeIn.duration(220)}
        exiting={FadeOut.duration(180)}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="auto">
        {reduceTransparency ? (
          <View style={{ flex: 1, backgroundColor: 'rgba(20,18,17,0.45)' }} />
        ) : (
          <BlurView intensity={28} tint="dark" style={{ flex: 1 }} />
        )}
        {/* Tap-to-dismiss layer (disabled for confirm) */}
        <Animated.View
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onTouchEnd={lockedOpen ? undefined : close}
        />
      </Animated.View>

      {/* Card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          key={current.id}
          entering={cardEnter()}
          exiting={cardExit()}
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight: '88%',
            },
            sheetStyle,
          ]}>
          <View
            className="overflow-hidden rounded-t-[28px] bg-parchment-card"
            style={{ paddingBottom: insets.bottom + 16 }}>
            {/* Glass chrome: grabber + floating dismiss */}
            <View className="items-center pt-3">
              <View className="h-1.5 w-10 rounded-full bg-fog" />
            </View>

            {!lockedOpen && (
              <View style={{ position: 'absolute', right: 14, top: 12, zIndex: 10 }}>
                <GlassView
                  white
                  interactive
                  effect="regular"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <View
                    onTouchEnd={() => {
                      onTap();
                      close();
                    }}
                    style={{ padding: 6 }}>
                    <HugeiconsIcon icon={Cancel01Icon} size={18} color="#343433" />
                  </View>
                </GlassView>
              </View>
            )}

            <CardBody directive={current} onClose={close} />
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
