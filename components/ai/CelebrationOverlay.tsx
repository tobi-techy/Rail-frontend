import React, { useEffect, useRef, useState } from 'react';
import { View, Modal } from 'react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion } from 'react-native-reanimated';
import * as Haptics from '@/utils/platformHaptics';
import { playChatSound } from '@/lib/chatSounds';
import { useAIChatStore } from '@/stores/aiChatStore';
import { Confetti } from './Confetti';
import { ShareableWinCard } from './ShareableWinCard';

/**
 * Listens for celebration events from the chat store and orchestrates the moment:
 *   - confetti burst (intensity scales with level)
 *   - a celebratory haptic + sound
 *   - for big/epic wins, a shareable win card modal
 *
 * Small wins fire confetti only (no modal) so the chat keeps flowing. Big/epic
 * wins surface the share card to drive the social loop.
 */
export function CelebrationOverlay() {
  const celebration = useAIChatStore((s) => s.celebration);
  const clearCelebration = useAIChatStore((s) => s.clearCelebration);

  const reducedMotion = useReducedMotion();
  const [burstKey, setBurstKey] = useState(0);
  const [confettiVisible, setConfettiVisible] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const lastHandledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!celebration) return;
    // Guard against re-firing for the same celebration object
    const sig = `${celebration.title}-${celebration.level}-${celebration.at ?? ''}`;
    if (lastHandledRef.current === sig) return;
    lastHandledRef.current = sig;

    // Fire the moment. Reduced motion: skip confetti, keep haptic/sound/card.
    setBurstKey((k) => k + 1);
    setConfettiVisible(!reducedMotion);

    const heavy = celebration.level === 'epic' || celebration.level === 'big';
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (heavy) {
      // A double-thump for the big wins
      setTimeout(() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 120);
    }
    playChatSound('celebrate');

    if (heavy) {
      setCardVisible(true);
    } else {
      // Small win: confetti only, auto-clear after it settles
      setTimeout(() => {
        setConfettiVisible(false);
        clearCelebration();
      }, 2400);
    }
  }, [celebration, clearCelebration, reducedMotion]);

  const handleCloseCard = () => {
    setCardVisible(false);
    setConfettiVisible(false);
    clearCelebration();
  };

  if (!celebration) return null;

  return (
    <>
      {/* Confetti always renders above content but never blocks touches */}
      {confettiVisible ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }}>
          <Confetti
            burstKey={burstKey}
            intensity={celebration.level}
            onDone={() => {
              if (!cardVisible) setConfettiVisible(false);
            }}
          />
        </View>
      ) : null}

      {/* Big/epic wins get the shareable card */}
      <Modal
        visible={cardVisible}
        transparent
        animationType="none"
        onRequestClose={handleCloseCard}>
        <Animated.View
          entering={FadeIn.duration(220)}
          exiting={FadeOut.duration(180)}
          className="flex-1 items-center justify-center bg-black/40 px-6">
          {/* Confetti inside the modal layer too, so it shows above the dim backdrop */}
          {!reducedMotion ? (
            <View
              pointerEvents="none"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
              <Confetti burstKey={burstKey + 1000} intensity={celebration.level} />
            </View>
          ) : null}
          <Animated.View entering={FadeIn.delay(120).springify().damping(15)}>
            <ShareableWinCard
              title={celebration.title}
              subtitle={celebration.subtitle}
              level={celebration.level}
              onClose={handleCloseCard}
            />
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}
