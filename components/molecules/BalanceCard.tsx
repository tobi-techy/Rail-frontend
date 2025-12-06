import React from 'react';
import {
  View,
  Text,
  ViewProps,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Icon } from '../atoms/Icon';
import { ArrowDown, ArrowDown01, ChevronDown, Eye, EyeOff } from 'lucide-react-native';
import { useUIStore } from '@/stores';
import { ActionSlideshow } from './ActionSlideshow';
import { sanitizeNumber } from '@/utils/sanitizeInput';

export interface BalanceCardProps extends ViewProps {
  balance?: string;
  percentChange?: string;
  timeframe?: string;
  currency?: string;
  buyingPower?: string;
  onVerifyPress?: () => void;
  onGetCardPress?: () => void;
  onCopyInvestorsPress?: () => void;
  onFundWithCryptoPress?: () => void;
  className?: string;
}



export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance = '$0.00',
  percentChange = '0.00%',
  timeframe = '1D',
  currency = 'USD',
  buyingPower = '$0.00',
  onVerifyPress,
  onGetCardPress,
  onCopyInvestorsPress,
  onFundWithCryptoPress,
  className,
  ...props
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const { isBalanceVisible, toggleBalanceVisibility } = useUIStore();

  // Helper function to mask balance values
  const maskValue = (value: string) => {
    const sanitized = sanitizeNumber(String(value));
    if (isBalanceVisible) return sanitized;
    // Replace numbers with dashes, keep currency symbol
    return sanitized.replace(/[\d,\.]+/g, (match) => '−'.repeat(Math.min(match.length, 6)));
  };

  return (
    <View
      className={`overflow-hidden ${className || ''}`}
      {...props}
    >
      {/* Main Balance Display */}
      <View className="pt-6 pb-4">
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
              {maskValue(balance)}
            </Text>
            <TouchableOpacity 
              onPress={toggleBalanceVisibility}
              accessibilityLabel={isBalanceVisible ? "Hide balance" : "Show balance"}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isBalanceVisible ? (
                <Eye size={24} color="#545454" strokeWidth={0.9} />
              ) : (
                <EyeOff size={24} color="#545454" strokeWidth={0.9} />
              )}
            </TouchableOpacity>
          </View>
            </View>
           

           <View className='flex-row items-center justify-between gap-x-4'>
           <View className="flex-row items-center">
              <Text className="text-base font-body-light text-red-600">
                {maskValue(percentChange)} <Text className='text-[#000] font-body-bold'>{timeframe}</Text>
              </Text>
            </View>
             
             <View className='flex-row items-center gap-x-1'>
             <Text className='text-base text-gray-400 font-body-light'>Buying Power:</Text>
             <Text className='text-[#000] text-base font-body-bold'>{maskValue(buyingPower)}</Text>
             </View>
          
           </View>
           
          </View>
        </View>
      </View>
   
    </View>
  );
};
