import React from 'react';
import { View, FlatList, Text, RefreshControl, FlatListProps } from 'react-native';
import { ListItem } from '../molecules/ListItem';
import { SearchBar } from '../molecules/SearchBar';
import { colors, typography, spacing } from '../../design/tokens';

export interface DataListItem {
  id: string;
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightText?: string;
  onPress?: () => void;
}

export interface DataListProps extends Omit<FlatListProps<DataListItem>, 'data' | 'renderItem'> {
  data: DataListItem[];
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  emptyStateTitle?: string;
  emptyStateSubtitle?: string;
  emptyStateIcon?: React.ReactNode;
  loading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  className?: string;
}

export const DataList: React.FC<DataListProps> = ({
  data,
  searchable = false,
  searchPlaceholder = 'Search...',
  onSearch,
  emptyStateTitle = 'No items found',
  emptyStateSubtitle = 'Try adjusting your search or filters',
  emptyStateIcon,
  loading = false,
  onRefresh,
  refreshing = false,
  className,
  ...flatListProps
}) => {
  const renderItem = ({ item, index }: { item: DataListItem; index: number }) => (
    <ListItem
      title={item.title}
      subtitle={item.subtitle}
      leftIcon={item.leftIcon}
      rightIcon={item.rightIcon}
      rightText={item.rightText}
      onPress={item.onPress}
      showDivider={index < data.length - 1}
    />
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-12 px-6">
      {emptyStateIcon && (
        <View className="mb-4">
          {emptyStateIcon}
        </View>
      )}
      <Text 
        className="text-[#000000] text-lg font-bold text-center mb-2"
        style={{
          fontFamily: typography.fonts.primary,
          fontSize: typography.styles.h3.size,
          fontWeight: typography.weights.bold,
        }}
      >
        {emptyStateTitle}
      </Text>
      <Text 
        className="text-[#A0A0A0] text-base text-center"
        style={{
          fontFamily: typography.fonts.secondary,
          fontSize: typography.styles.body.size,
          lineHeight: typography.lineHeights.relaxed * typography.styles.body.size,
        }}
      >
        {emptyStateSubtitle}
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View className="flex-1 items-center justify-center py-12">
      <Text 
        className="text-[#A0A0A0] text-base"
        style={{
          fontFamily: typography.fonts.secondary,
          fontSize: typography.styles.body.size,
        }}
      >
        Loading...
      </Text>
    </View>
  );

  return (
    <View className={`flex-1 ${className || ''}`}>
      {/* Search Bar */}
      {searchable && (
        <View className="px-4 py-3 bg-white">
          <SearchBar
            placeholder={searchPlaceholder}
            onSearch={onSearch}
          />
        </View>
      )}

      {/* List */}
      {loading ? (
        renderLoadingState()
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary.lavender}
                colors={[colors.primary.lavender]}
              />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
          {...flatListProps}
        />
      )}
    </View>
  );
};