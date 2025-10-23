import React from 'react';
import {
  View,
  Text,
  ViewProps,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Icon } from '../atoms/Icon';
import { ArrowDown, ArrowDown01, ChevronDown, Eye } from 'lucide-react-native';

export interface BalanceCardProps extends ViewProps {
  balance?: string;
  percentChange?: string;
  timeframe?: string;
  currency?: string;
  onWithdrawPress?: () => void;
  onReceivePress?: () => void;
  onHistoryPress?: () => void;
  onMorePress?: () => void;
  className?: string;
}

const ActionButton = ({
  icon,
  label,
  onPress,
  library = 'lucide',
  bgColor = 'bg-secondary',
}: {
  icon: string;
  label: string;
  onPress?: () => void;
  library?: string;
  bgColor?: string;
}) => (
  <TouchableOpacity 
    className="items-center justify-center"
    onPress={onPress}
    accessibilityLabel={label}
  >
    <View className={`w-14 h-14 rounded-full ${bgColor} items-center justify-center mb-1`}>
      <Icon
        library={library as any}
        name={icon}
        size={24}
        strokeWidth={2}
      />
    </View>
    <Text className="text-[14px] font-body-medium">{label}</Text>
  </TouchableOpacity>
);

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance = '$0.00',
  percentChange = '0.00%',
  timeframe = '1D',
  currency = 'USD',
  onWithdrawPress,
  onReceivePress,
  onHistoryPress,
  onMorePress,
  className,
  ...props
}) => {
  const { width: screenWidth } = useWindowDimensions();

  return (
    <View
      className={`overflow-hidden ${className || ''}`}
      {...props}
    >
      {/* Main Balance Display */}
      <View className="px-4 pt-6 pb-4">
        <View className="flex-row justify-between items-start">
          <View>
            <TouchableOpacity className='flex-row items-center gap-x-2'>
              <Text className='text-[14px] text-[#000] font-body-bold leading-6'>Account 1</Text>
              <ChevronDown size={16} fill="#000" strokeWidth={2} />
            </TouchableOpacity>
            <View className='items-start gap-x-2 mt-2'>
             <Text className='text-[17px] font-body-medium text-gray-400'>Total Portfolio</Text>
          <View className='flex-row items-center gap-x-2'>
          <Text className="text-[40px] font-bold font-body-bold mb-1">
              {balance}
            </Text>
            <Eye size={24} color="#545454" strokeWidth={0.9} />
          </View>
            </View>
           

           <View className='flex-row items-center justify-between gap-x-4'>
           <View className="flex-row items-center">
              <Text className="text-base font-body-light text-red-600">
                {percentChange} <Text className='text-[#000] font-body-bold'>{timeframe}</Text>
              </Text>
            </View>
             
             <View className='flex-row items-center gap-x-1'>
             <Text className='text-base text-gray-400 font-body-light'>Buying Power:</Text>
             <Text className='text-[#000] text-base font-body-bold'>$00:00</Text>
             </View>
          
           </View>
           
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row justify-between px-[14px] pb-6">
        <ActionButton
          icon="shopping-basket"
          label="Create"
          bgColor="bg-[#F7F7F7]"
          onPress={onWithdrawPress}
        />

        <ActionButton
          icon="arrow-down"
          label="Top Up"
          bgColor="bg-[#F7F7F7]"
          onPress={onReceivePress}
        />

        <ActionButton
          icon="arrow-up"
          label="Withdraw"
          bgColor="bg-[#F7F7F7]"
          onPress={onHistoryPress}
        />

        <ActionButton
          icon="credit-card"
          label="Cards"
          bgColor="bg-[#F7F7F7]"
          onPress={onMorePress}
        />
      </View>
    </View>
  );
};
