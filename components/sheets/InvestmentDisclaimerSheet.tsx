import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { Button } from '@/components/ui';

interface InvestmentDisclaimerSheetProps {
  visible: boolean;
  onAccept: () => void;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View className="mb-6">
    <Text className="mb-2 font-button text-[15px] text-black">{title}</Text>
    <Text className="font-body text-[14px] leading-[22px] text-black/70">{children}</Text>
  </View>
);

const BulletPoint = ({ children }: { children: React.ReactNode }) => (
  <View className="mb-2 flex-row">
    <Text className="mr-3 font-body text-[14px] text-black/40">•</Text>
    <Text className="flex-1 font-body text-[14px] leading-[22px] text-black/70">{children}</Text>
  </View>
);

export function InvestmentDisclaimerSheet({ visible, onAccept }: InvestmentDisclaimerSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onAccept} showCloseButton={false} dismissible={false}>
      <View className="max-h-[80vh]">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-center font-subtitle text-[24px] text-black">How Rail Works</Text>
          <Text className="mt-2 text-center font-body text-[14px] leading-[20px] text-black/50">
            Understanding your automated wealth system
          </Text>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          className="max-h-[50vh]"
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{ paddingBottom: 8 }}>
          <Section title="Automatic Investment">
            When you add money to Rail, it immediately goes to work. Every deposit is automatically
            split: 70% goes to Base Rail for stability and capital preservation, while 30% goes to
            Active Rail for growth through diversified investments. This happens instantly — no
            buttons to press, no decisions to make.
          </Section>

          <Section title="The Rail Split Explained">
            Base Rail (70%) keeps your money stable and accessible. It&apos;s designed for lower
            volatility and liquidity when you need it. Active Rail (30%) is where growth happens —
            your money is automatically invested into a diversified portfolio of assets managed by
            our system. This split applies to every deposit and is designed to balance safety with
            growth.
          </Section>

          <Section title="Following Conductors">
            Conductors are verified professional investors who create and manage Tracks — curated
            investment strategies you can follow. When you follow a Track, a portion of your Active
            Rail automatically mirrors the Conductor&apos;s moves. You can browse different Tracks,
            see their performance history, and follow or unfollow at any time. Your positions update
            automatically when the Conductor makes changes.
          </Section>

          <View className="mb-6">
            <Text className="mb-3 font-button text-[15px] text-black">Understanding Risk</Text>
            <BulletPoint>
              The value of your investments can go up or down — this is completely normal and part
              of how markets work
            </BulletPoint>
            <BulletPoint>
              Past performance of any investment, Track, or Conductor does not guarantee future
              results
            </BulletPoint>
            <BulletPoint>
              Only add money you&apos;re comfortable not accessing immediately — investing works
              best over time
            </BulletPoint>
            <BulletPoint>
              Diversification helps manage risk but cannot eliminate it entirely
            </BulletPoint>
            <BulletPoint>
              Market conditions change daily based on economic factors beyond anyone&apos;s control
            </BulletPoint>
            <BulletPoint>
              You can withdraw your money anytime, but short-term withdrawals may mean missing
              growth opportunities
            </BulletPoint>
          </View>

          <Section title="What Rail Does">
            Rail is an automated wealth system. We provide the infrastructure, the investment
            engine, and the tools to help your money grow. We handle the complexity of investing so
            you don&apos;t have to think about asset allocation, market timing, or portfolio
            rebalancing.
          </Section>

          <Section title="What Rail Doesn't Do">
            Rail is not a financial advisor and does not provide personalized financial advice. We
            don&apos;t tell you how much to invest, when to invest, or whether investing is right
            for your personal situation. The system operates based on rules and algorithms, not
            individual recommendations. All investment decisions — including choosing to use Rail —
            are ultimately yours.
          </Section>

          <View className="mb-4 rounded-2xl bg-black/[0.03] p-4">
            <Text className="font-body text-[13px] leading-[20px] text-black/60">
              By tapping &quot;I Understand&quot; below, you acknowledge that: (1) investing
              involves risk and you may lose money, (2) Rail does not provide financial advice, (3)
              past performance does not guarantee future results, and (4) you are responsible for
              your own investment decisions.
            </Text>
          </View>
        </ScrollView>

        {/* Accept Button */}
        <View className="mt-4 pt-2">
          <Button title="I Understand" onPress={onAccept} />
        </View>
      </View>
    </BottomSheet>
  );
}
