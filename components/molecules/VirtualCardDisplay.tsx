import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { Card } from '../atoms/Card';
import { Icon } from '../atoms/Icon';
import {
  colors,
  typography,
  spacing,
  shadows,
  animations,
} from '../../design/tokens';

export interface CardData {
  cardType?: 'visa' | 'mastercard';
  cardNumber: string;
  balance: number;
  currency?: string;
}

export interface VirtualCreditCardProps {
  id?: string;
  cardTitle?: string;
  cardNumber?: string;
  cardholderName?: string;
  expiryDate?: string;
  cvc?: string;
  cardType?: 'visa' | 'mastercard';
  balance?: number;
  currency?: string;
  card?: CardData;
  backgroundColor?: string;
  textColor?: string;
}

export const VirtualCreditCard: React.FC<VirtualCreditCardProps> = ({
  cardTitle,
  cardNumber,
  cardholderName,
  expiryDate,
  cvc,
  cardType = 'visa',
  balance = 0,
  currency = 'USD',
  card,
  backgroundColor,
  textColor,
}) => {
  // Use card object values as fallbacks if direct props aren't provided
  const resolvedCardType = cardType || card?.cardType || 'visa';
  const resolvedCardNumber = cardNumber || card?.cardNumber || '';
  const resolvedBalance = balance || card?.balance || 0;
  const resolvedCurrency = currency || card?.currency || 'USD';
  const resolvedBackgroundColor = backgroundColor || colors.accent.limeGreen;
  const resolvedTextColor = textColor || colors.text.onAccent;
  const [isFlipped, setIsFlipped] = useState(false);
  const rotationAnim = useRef(new Animated.Value(0)).current;

  const formatCardNumber = (num: string) => {
    if (!num) return '';
    return `**** **** **** ${num.slice(-4)}`;
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: resolvedCurrency,
    }).format(amount);
  };

  const frontAnimatedStyle = {
    transform: [
      {
        rotateY: rotationAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  const backAnimatedStyle = {
    transform: [
      {
        rotateY: rotationAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        }),
      },
    ],
  };

  const flipCard = () => {
    Animated.timing(rotationAnim, {
      toValue: isFlipped ? 0 : 1,
      duration: animations.normal,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  return (
    <TouchableOpacity onPress={flipCard} activeOpacity={0.9}>
      <View className="h-[240px] w-full">
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
            },
            frontAnimatedStyle,
          ]}
        >
          <Card
            padding="medium"
            style={{
              height: '100%',
              backgroundColor: "#000",
              justifyContent: 'space-between',
            }}
          >
            <View className="flex-row justify-between items-center">
              <Text
                className="font-body-bold text-lg font-bold"
                style={{ color: "#fff" }}
              >
                {cardTitle || 'Virtual Card'}
              </Text>
              <Icon
                name={resolvedCardType === 'visa' ? 'cc-visa' : 'cc-mastercard'}
                library="fontawesome"
                size={28}
                color={"#fff"}
              />
            </View>
            <View>
              <Text
                className="text-body-size tracking-xs mb-md font-mono"
                style={{ color: "#fff" }}
              >
                {formatCardNumber(resolvedCardNumber)}
              </Text>
              <View className="flex-row justify-between">
                <Text
                  className="font-primary text-caption-size"
                  style={{ color: "#fff" }}
                >
                  {cardholderName || ''}
                </Text>
              </View>
            </View>
            <View>
              <Text
                className="font-primary text-caption-size"
                style={{ color: colors.text.secondary }}
              >
                Balance
              </Text>
              <Text
                className="font-secondary text-xl font-bold"
                style={{ color: "#fff" }}
              >
                {formatBalance(resolvedBalance)}
              </Text>
            </View>
          </Card>
        </Animated.View>
        <Animated.View
          style={[
            shadows.lg,
            {
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
            },
            backAnimatedStyle,
          ]}
        >
          <Card
            padding="medium"
            style={{
              height: '100%',
              backgroundColor: "#000",
              justifyContent: 'space-between',
            }}
          >
            <View>
              <View
                className="bg-on-accent h-12 mt-lg"
              />
              <View
                className="flex-row items-center mt-md bg-on-accent p-sm rounded-xs"
              >
                <Text
                  className="flex-1 text-right font-mono text-base"
                  style={{ color: "#fff" }}
                >
                  {cvc || '***'}
                </Text>
              </View>
              <Text
                className="text-xs mt-lg self-end"
                style={{ color: "#fff" }}
              >
                {expiryDate ? `Expires: ${expiryDate}` : 'Expires: MM/YY'}
              </Text>
            </View>
            <Icon
              name={resolvedCardType === 'visa' ? 'cc-visa' : 'cc-mastercard'}
              library="fontawesome"
              size={28}
              color={"#fff"}
              style={{ alignSelf: 'flex-end' }}
            />
          </Card>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};
