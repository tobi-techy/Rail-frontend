import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTapToPay, type NearbyPeer } from '@/hooks/useTapToPay';
import { useAuthStore } from '@/stores/authStore';
import { ArrowLeft01Icon, Wifi01Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

function PulseRing() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(2.2, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={style}
      className="absolute h-32 w-32 rounded-full border-2 border-[#6366F1]"
    />
  );
}

function PeerCard({ peer, onPress }: { peer: NearbyPeer; onPress: () => void }) {
  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        className="mb-3 flex-row items-center gap-4 rounded-2xl bg-[#F9FAFB] px-5 py-4 active:bg-[#F3F4F6]">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-[#EEF2FF]">
          <Text className="font-subtitle text-[18px] text-[#6366F1]">
            {peer.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="font-subtitle text-[16px] text-[#070914]">{peer.displayName}</Text>
          <Text className="font-body text-[13px] text-[#9CA3AF]">@{peer.railtag}</Text>
        </View>
        <View className="rounded-full bg-[#ECFDF5] px-3 py-1">
          <Text className="font-caption text-[11px] text-[#10B981]">Nearby</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function AmountEntry({
  peer,
  onSend,
  onCancel,
}: {
  peer: NearbyPeer;
  onSend: (amount: string) => void;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState('');

  const handleKey = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (key === 'del') {
      setAmount((a) => a.slice(0, -1));
    } else if (key === '.') {
      if (!amount.includes('.')) setAmount((a) => a + '.');
    } else {
      const parts = amount.split('.');
      if (parts[1] && parts[1].length >= 2) return;
      setAmount((a) => a + key);
    }
  };

  return (
    <Animated.View entering={FadeInUp.duration(300)} className="flex-1">
      <View className="items-center pt-8">
        <Text className="font-body text-[15px] text-[#9CA3AF]">Sending to {peer.displayName}</Text>
        <Text className="font-heading mt-4 text-[48px] text-[#070914]">${amount || '0'}</Text>
      </View>

      <View className="flex-1" />

      <View className="px-6 pb-2">
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
          ['.', '0', 'del'],
        ].map((row, ri) => (
          <View key={ri} className="mb-2 flex-row justify-between">
            {row.map((k) => (
              <Pressable
                key={k}
                onPress={() => handleKey(k)}
                className="h-[60px] flex-1 items-center justify-center">
                <Text className="font-subtitle text-[26px] text-[#070914]">
                  {k === 'del' ? '←' : k}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>

      <View className="flex-row gap-3 px-6 pb-6">
        <Pressable onPress={onCancel} className="flex-1 items-center rounded-2xl bg-[#F3F4F6] py-4">
          <Text className="font-subtitle text-[15px] text-[#070914]">Cancel</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (parseFloat(amount) > 0) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onSend(amount);
            }
          }}
          className="flex-1 items-center rounded-2xl bg-[#070914] py-4">
          <Text className="font-subtitle text-[15px] text-white">Send</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function IncomingRequest({
  senderName,
  amount,
  onAccept,
  onDecline,
}: {
  senderName: string;
  amount: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <Animated.View
      entering={FadeInUp.duration(400)}
      className="flex-1 items-center justify-center px-6">
      <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-[#EEF2FF]">
        <Text className="font-heading text-[32px] text-[#6366F1]">
          {senderName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text className="font-subtitle text-[18px] text-[#070914]">{senderName}</Text>
      <Text className="mt-2 font-body text-[15px] text-[#9CA3AF]">wants to send you</Text>
      <Text className="font-heading mt-4 text-[48px] text-[#070914]">${amount}</Text>

      <View className="mt-12 w-full flex-row gap-3">
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onDecline();
          }}
          className="flex-1 items-center rounded-2xl bg-[#FEF2F2] py-4">
          <Text className="font-subtitle text-[15px] text-[#EF4444]">Decline</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onAccept();
          }}
          className="flex-1 items-center rounded-2xl bg-[#070914] py-4">
          <Text className="font-subtitle text-[15px] text-white">Accept</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function TapToPayScreen() {
  const user = useAuthStore((s) => s.user);
  const railtag = user?.rail_tag || user?.email?.split('@')[0] || 'user';
  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Rail User';

  const {
    peers,
    incomingRequest,
    transferAccepted,
    transferDeclined,
    isActive,
    isSupported,
    start,
    stop,
    sendIntent,
    respond,
  } = useTapToPay(railtag, displayName);

  const [selectedPeer, setSelectedPeer] = useState<NearbyPeer | null>(null);
  const [sendingAmount, setSendingAmount] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  // Handle transfer accepted — execute the actual P2P transfer
  useEffect(() => {
    if (transferAccepted && sendingAmount) {
      // Navigate to authorize screen, then P2P send happens
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedPeer(null);
        setSendingAmount(null);
      }, 2500);
    }
  }, [transferAccepted, sendingAmount]);

  if (!isSupported) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-8">
        <Text className="text-center font-subtitle text-[18px] text-[#070914]">
          Tap to Pay is only available on iOS
        </Text>
        <Pressable onPress={() => router.back()} className="mt-6">
          <Text className="font-body text-[15px] text-[#3B82F6]">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // Success state
  if (success) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Animated.View entering={FadeInUp.duration(400)} className="items-center">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={64} color="#10B981" />
          <Text className="mt-4 font-subtitle text-[22px] text-[#070914]">Sent!</Text>
          <Text className="mt-2 font-body text-[15px] text-[#9CA3AF]">
            ${sendingAmount} sent to {selectedPeer?.displayName}
          </Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Incoming request
  if (incomingRequest) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" />
        <IncomingRequest
          senderName={incomingRequest.senderName}
          amount={incomingRequest.amount}
          onAccept={() => respond(incomingRequest.peerId, true)}
          onDecline={() => respond(incomingRequest.peerId, false)}
        />
      </SafeAreaView>
    );
  }

  // Amount entry for selected peer
  if (selectedPeer) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" />
        <AmountEntry
          peer={selectedPeer}
          onSend={(amount) => {
            setSendingAmount(amount);
            sendIntent(selectedPeer.peerId, amount);
          }}
          onCancel={() => setSelectedPeer(null)}
        />
      </SafeAreaView>
    );
  }

  // Discovery screen
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="flex-row items-center gap-4 px-6 pt-3">
        <Pressable
          onPress={() => {
            stop();
            router.back();
          }}
          className="h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6]">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#070914" strokeWidth={2} />
        </Pressable>
        <Text className="font-subtitle text-[18px] text-[#070914]">Tap to Pay</Text>
      </View>

      {/* Pulse animation */}
      <View className="mt-10 items-center justify-center">
        <PulseRing />
        <PulseRing />
        <View className="h-32 w-32 items-center justify-center rounded-full bg-[#EEF2FF]">
          <HugeiconsIcon icon={Wifi01Icon} size={36} color="#6366F1" />
        </View>
      </View>

      <View className="mt-6 items-center px-6">
        <Text className="font-subtitle text-[18px] text-[#070914]">
          {peers.length > 0 ? 'People nearby' : 'Looking for nearby users...'}
        </Text>
        <Text className="mt-1 font-body text-[13px] text-[#9CA3AF]">
          {peers.length > 0 ? 'Tap someone to send them money' : 'Ask them to open Tap to Pay too'}
        </Text>
      </View>

      {/* Peer list */}
      <View className="mt-6 flex-1 px-6">
        {peers.length === 0 && (
          <View className="mt-8 items-center">
            <ActivityIndicator size="small" color="#6366F1" />
          </View>
        )}
        {peers.map((peer) => (
          <PeerCard key={peer.peerId} peer={peer} onPress={() => setSelectedPeer(peer)} />
        ))}
      </View>

      {/* Declined toast */}
      {transferDeclined && (
        <Animated.View
          entering={FadeInUp.duration(200)}
          className="absolute bottom-10 left-6 right-6 items-center rounded-2xl bg-[#FEF2F2] py-3">
          <Text className="font-body text-[14px] text-[#EF4444]">Transfer was declined</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
