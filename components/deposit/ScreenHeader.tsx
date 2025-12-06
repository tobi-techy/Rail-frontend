import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { breakpoints } from '@/design/tokens';

type DepositScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAccessory?: ReactNode;
};

const DepositScreenHeader: React.FC<DepositScreenHeaderProps> = ({
  title,
  subtitle,
  onBack = () => router.back(),
  rightAccessory,
}) => {
  const { width } = useWindowDimensions();
  const isSmallPhone = width <= breakpoints.sm;
  const isMediumPhone = width <= breakpoints.md;

  const horizontalPadding = isSmallPhone ? 20 : 24;
  const topPadding = isSmallPhone ? 12 : 16;
  const bottomPadding = isSmallPhone ? 24 : 32;
  const headerSpacing = isSmallPhone ? 20 : 32;
  const buttonSize = isSmallPhone ? 36 : 40;
  const titleFontSize = isSmallPhone ? 26 : isMediumPhone ? 30 : 32;
  const titleLineHeight = isSmallPhone ? 30 : isMediumPhone ? 34 : 36;
  const subtitleFontSize = isSmallPhone ? 14 : 16;
  const subtitleLineHeight = isSmallPhone ? 20 : 22;

  return (
    <View
      style={{
        paddingHorizontal: horizontalPadding,
        paddingTop: topPadding,
        paddingBottom: bottomPadding,
      }}
    >
      <View
        className="flex-row items-center justify-between"
        style={{ marginBottom: headerSpacing }}
      >
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.9}
          className="items-center justify-center rounded-full bg-[#F3F4F6]"
          accessibilityLabel="Go back"
          style={{
            width: buttonSize,
            height: buttonSize,
          }}
        >
          <ArrowLeft size={18} color="#111827" strokeWidth={1.5} />
        </TouchableOpacity>
        {rightAccessory ? (
          rightAccessory
        ) : (
          <View style={{ width: buttonSize, height: buttonSize }} />
        )}
      </View>
      <Text
        className="font-body-bold text-[#0B1120]"
        style={{ fontSize: titleFontSize, lineHeight: titleLineHeight }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          className="mt-3 text-[#6B7280]"
          style={{ fontSize: subtitleFontSize, lineHeight: subtitleLineHeight }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};

export default DepositScreenHeader;
